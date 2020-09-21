const Organization = require('./github/Organization')
  , RepositoryActivity = require('./github/RepositoryActivity')
  , UserActivity = require('./UserActivity')
;


module.exports = class OrganizationUserActivity {

  constructor(octokit) {
    this._organization = new Organization(octokit);
    this._repositoryActivity = new RepositoryActivity(octokit);
  }

  get organizationClient() {
    return this._organization;
  }

  get repositoryClient() {
    return this._repositoryActivity;
  }

  async getUserActivity(org, since) {
    const self = this;

    const repositories = await self.organizationClient.getRepositories(org)
      , orgUsers = await self.organizationClient.findUsers(org)
    ;

    const activityResults = {};
    for(let idx = 0; idx< repositories.length; idx++) {
      const repoActivity = await self.repositoryClient.getActivity(repositories[idx], since);
      Object.assign(activityResults, repoActivity);
    }

    const userActivity = generateUserActivityData(activityResults);

    orgUsers.forEach(user => {
      if (userActivity[user.login]) {
        if (user.email && user.email.length > 0) {
          userActivity[user.login] = user.email;
        }
      } else {
        const userData = new UserActivity(user.login);
        userData.email = user.email;

        userActivity[user.login] = userData
      }
    });

    // An array of user activity objects
    return Object.values(userActivity);
  }
}

function generateUserActivityData(data) {
  if (!data) {
    return null
  }

  // Use an object to ensure unique user to activity based on user key
  const results = {};

  function process(repo, values, activityType) {
    if (values) {
      Object.keys(values).forEach(login => {
        if (!results[login]) {
          results[login] = new UserActivity(login);
        }

        results[login].increment(activityType, repo, values[login]);
      })
    }
  }

  Object.keys(data).forEach(repo => {
    const activity = data[repo];
    Object.keys(activity).forEach(activityType => {
      process(repo, activity[activityType], activityType)
    });
  });

  return results;
}