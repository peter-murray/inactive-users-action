const util = require('../dateUtil');

module.exports = class PullRequestActivity {

  constructor(octokit, core) {
    if (!octokit) {
      throw new Error('An octokit client must be provided');
    }
    this._octokit = octokit;
    this._core = core;
  }

  getPullRequestCommentActivityFrom(owner, repo, since, debug) {
    const from = util.getFromDate(since)
      , repoFullName = `${owner}/${repo}`
    ;

    return this.octokit.paginate('GET /repos/:owner/:repo/pulls/comments',
      {
        owner: owner,
        repo: repo,
        since: from,
        per_page: 100,
      }
    ).then(prComments => {
      const users = {};

      prComments.forEach(prComment => {
        if (prComment.user && prComment.user.login) {
          const login = prComment.user.login;

          if (!users[login]) {
            users[login] = 1;
          } else {
            users[login] = users[login] + 1;
          }
        }
      });

      const result = {};
      result[repoFullName] = users;

      this.core.info(`    identified pull request comment activity for ${Object.keys(users).length} users in repository ${owner}/${repo}`);

      if(debug) {
        this.core.startGroup('debug pull request object')
        this.core.info(JSON.stringify(result, null, 2));
        this.core.endGroup();
      }
      return result;
    })
      .catch(err => {
        if (err.status === 404) {
          this.core.warning(`    failed to load pull request activity for ${owner}/${repo}`);
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


