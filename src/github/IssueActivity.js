const util = require('../dateUtil');

module.exports = class IssueActivity {

  constructor(octokit, core) {
    if (!octokit) {
      throw new Error('An octokit client must be provided');
    }
    this._octokit = octokit;
    this._core = core;
  }

  getIssueActivityFrom(owner, repo, since, debug) {
    const from = util.getFromDate(since)
      , repoFullName = `${owner}/${repo}`
      , core = this.core
    ;

    return this.octokit.paginate('GET /repos/:owner/:repo/issues',
      {
        owner: owner,
        repo: repo,
        since: from,
        per_page: 100,
      }
    ).then(issues => {
      const users = {};

      issues.forEach(issue => {
        if (issue.user && issue.user.login) {
          const login = issue.user.login;

          if (!users[login]) {
            users[login] = 1;
          } else {
            users[login] = users[login] + 1;
          }
        }
      });

      const data = {}
      data[repoFullName] = users;

      if(debug) {
        core.startGroup('debug issue activity object')
        core.info(JSON.stringify(data, null, 2));
        core.endGroup();
      }

      return data;
    }).catch(err => {
      if (err.status === 404) {
        return {};
      } else {
        console.error(err)
        throw err;
      }
    });
  }

  getIssueCommentActivityFrom(owner, repo, since, debug) {
    const from = util.getFromDate(since)
      , repoFullName = `${owner}/${repo}`
      , core = this.core
    ;

    return this.octokit.paginate('GET /repos/:owner/:repo/issues/comments',
      {
        owner: owner,
        repo: repo,
        since: from,
        per_page: 100,
      }
    ).then(comments => {
      const users = {};

      comments.forEach(comment => {
        if (comment.user && comment.user.login) {
          const login = comment.user.login;

          if (!users[login]) {
            users[login] = 1;
          } else {
            users[login] = users[login] + 1;
          }
        }
      });

      const data = {}
      data[repoFullName] = users;
      this.core.info(`    identified issue comment activity for ${Object.keys(users).length} users in repository ${owner}/${repo}`);

      if(debug) {
        core.startGroup('debug issue comments object')
        core.info(JSON.stringify(data, null, 2));
        core.endGroup();
      }

      return data;
    }).catch(err => {
      if (err.status === 404) {
        this.core.warning(`    failed to load issue comment activity for ${owner}/${repo}`);
        return {};
      } else {
        console.error(err)
        throw err;
      }
    })
  }

  get octokit() {
    return this._octokit;
  }

  get core() {
    return this._core;
  }
}