const util = require('../dateUtil');

module.exports = class CommitActivity {

  constructor(octokit, core) {
    if (!octokit) {
      throw new Error('An octokit client must be provided');
    }
    this._octokit = octokit;
    this._core = core;
  }

  getCommitActivityFrom(owner, repo, since) {
    const from = util.getFromDate(since)
      , repoFullName = `${owner}/${repo}`
    ;

    return this.octokit.paginate('GET /repos/:owner/:repo/commits',
      {
        owner: owner,
        repo: repo,
        since: from,
        per_page: 100,
      }
    ).then(commits => {
      const committers = {};

      commits.forEach(commit => {
        if (commit.author && commit.author.login) {
          const login = commit.author.login;

          if (!committers[login]) {
            committers[login] = 1;
          } else {
            committers[login] = committers[login] + 1;
          }
        }
      });

      const result = {};
      result[repoFullName] = committers;
      this.core.info(`    identified commit activity for ${Object.keys(committers).length} users in repository ${owner}/${repo}`);
      return result;
    })
      .catch(err => {
        if (err.status === 404) {
          this.core.warning(`    failed to load commit activity for ${owner}/${repo}`);
          return {};
        } else if (err.status === 409) {
          if (err.message.toLowerCase().startsWith('git repository is empty')) {
            return {};
          } else {
            throw err;
          }
        } else {
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


