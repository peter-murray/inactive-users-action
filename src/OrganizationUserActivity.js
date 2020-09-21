const Organization = require('./github/Organization')
  , RepositoryActivity = require('./src/github/RepositoryActivity')
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

  getUserActivity(org, since) {
    const self = this;

    return self.organizationClient.getRepositories(org)
      .then(repositories => {
        const promises = [];
        repositories.forEach(repo => {
          promises.push(self.repositoryClient.getActivity(repo, since))
        });
        return Promise.all(promises)
      })
      .then(res => {
        // Unpack the resolved promises into an object mapping repos to activity
        const result = {};
        if (res) {
          res.forEach(repoActivity => {
            Object.assign(result, repoActivity);
          });
        }
        return result;
      })
      .then(repoActivity => {
        const userActivity = generateUserActivityData(repoActivity);

        // Process the users in the organization filling in any blanks from lack of activity and providing emails if present
        return self.organizationClient.findUsers(org)
          .then(orgUsers => {
            // ensure we have a user entry for each organization user
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
          });
      });
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
