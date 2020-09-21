const util = require('../dateUtil');

module.exports = class IssueActivity {

  constructor(octokit) {
    if (!octokit) {
      throw new Error('An octokit client must be provided');
    }
    this._octokit = octokit;
  }

  getIssueActivityFrom(owner, repo, since) {
    const from = util.getFromDate(since)
      , repoFullName = `${owner}/${repo}`
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

  getIssueCommentActivityFrom(owner, repo, since) {
    const from = util.getFromDate(since)
      , repoFullName = `${owner}/${repo}`
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
      return data;
    }).catch(err => {
      if (err.status === 404) {
        //TODO could log this out
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
}