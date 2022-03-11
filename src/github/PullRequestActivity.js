const util = require('../dateUtil');

module.exports = class PullRequestActivity {

  constructor(octokit) {
    if (!octokit) {
      throw new Error('An octokit client must be provided');
    }
    this._octokit = octokit;
  }

  getPullRequestCommentActivityFrom(owner, repo, since) {
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

      return result;
    })
      .catch(err => {
        if (err.status === 404) {
          //TODO could log this out
          return {};
        } else {
          console.error(err)
          throw err;
        }
      })
  }

  getPullRequestReviewActivityFrom(owner, repo, since, debug) {
    const from = Date.parse(util.getFromDate(since))
      , repoFullName = `${owner}/${repo}`
      , core = this.core
    ;

    const pullRequests = await this.getPullRequestsFrom(owner, repo, since, debug)
    const users = {}

    for (const pullRequest of pullRequests) {
      const reviews = await this.getPullRequestReviewsFrom(owner, repo, pullRequest, debug)
      for (const prReview of reviews) {
        if (prReview.user && prReview.user.login) {
          const login = prReview.user.login;

          if (!users[login]) {
            users[login] = 1;
          } else {
            users[login] = users[login] + 1;
          }
        }
      }
    }

    const result = {};
    result[repoFullName] = users;

    this.core.info(`    identified pull request open/closed/approved activity for ${Object.keys(users).length} users in repository ${owner}/${repo}`);

    if(debug) {
      core.startGroup('debug pull request object')
      core.info(JSON.stringify(result, null, 2));
      core.endGroup();
    }
    return result;

  }

  getPullRequestReviewsFrom(owner, repo, pullRequest, debug) {
    return this.octokit.paginate('GET /repos/:owner/:repo/pulls/:pull_number/reviews',
      {
      owner: owner,
      repo: repo,
      pull_number: pullRequest.number,
      per_page: 100,
    }).then(prReviews => {
      return prReviews
    }).catch(err => {
      if (err.status === 404) {
        this.core.warning(`    failed to load pull request reviews for ${owner}/${repo}/pull/${pullRequest.number}`);
        return {};
      } else {
        console.error(err)
        throw err;
      }
    })
  }

  getPullRequestsFrom(owner, repo, since, debug) {
    const from = Date.parse(util.getFromDate(since))
    ;

    return this.octokit.paginate('GET /repos/:owner/:repo/pulls',
      {
        owner: owner,
        repo: repo,
        state: 'all',
        per_page: 100,
      }
    ).then((pullRequests) => {
      let result = pullRequests.filter((pullRequest) => {
        const opened = Date.parse(pullRequest.created_at)
        const closed = Date.parse(pullRequest.closed_at)
        return (closed == null && opened >= from) || (closed != null && closed >= from)
      })
      return result
    }).catch(err => {
        if (err.status === 404) {
          this.core.warning(`    failed to load pull requests for ${owner}/${repo}`);
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


