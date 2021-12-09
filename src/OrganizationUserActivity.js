const Organization = require('./github/Organization')
  , RepositoryActivity = require('./github/RepositoryActivity')
  , UserActivity = require('./UserActivity')
  , fsUtil = require('./fsUtil')
;


module.exports = class OrganizationUserActivity {

  constructor(octokit, core) {
    this._core = core;

    this._organization = new Organization(octokit);
    this._repositoryActivity = new RepositoryActivity(octokit, core);
  }

  get organizationClient() {
    return this._organization;
  }

  get repositoryClient() {
    return this._repositoryActivity;
  }

  async getUserActivity(org, since, debug) {
    const self = this
      , core = this._core
      ;

    const repositories = await self.organizationClient.getRepositories(org)
      , orgUsers = await self.organizationClient.findUsers(org)
    ;

    const activityResults = {};
    for(let idx = 0; idx< repositories.length; idx++) {
      const repoActivity = await self.repositoryClient.getActivity(repositories[idx], since);
      Object.assign(activityResults, repoActivity);
    }

    if (debug) {
      core.startGroup('Organization Repository Activity Data');
      core.info(JSON.stringify(activityResults, null, 2));

      fsUtil.saveOutputFile(
        process.cwd, 
        'organization_user_activity_from_api.json',
        JSON.stringify(activityResults),
        'data_organization_user_activity'
      );

      core.endGroup();
    }

    const userActivity = generateUserActivityData(activityResults);

    if (debug) {
      core.startGroup('User Activity Map');
      core.info(JSON.stringify(userActivity, null, 2));
      core.endGroup();
    }

    orgUsers.forEach(user => {
      if (userActivity[user.login]) {
        if (user.email && user.email.length > 0) {
          userActivity[user.login].email = user.email;
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