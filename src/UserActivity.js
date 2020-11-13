const UserActivityAttributes = require('./UserActivityAttributes');

module.exports = class UserActivity {

    constructor(login) {
        this._login = login;

        const data = {};
        Object.values(UserActivityAttributes).forEach(type => {
            data[type] = {};
        });
        this._data = data;
    }

    get login() {
        return this._login;
    }

    get email() {
        return this._email || '';
    }

    set email(email) {
        this._email = email;
    }

    get isActive() {
        return (this.commits + this.pullRequestComments + this.issueComments + this.issues) > 0;
    }

    increment(attribute, repo, amount) {
        if (Object.values(UserActivityAttributes).indexOf(attribute) > -1) {
            if (!this._data[attribute][repo]) {
                this._data[attribute][repo] = 0
            }
            this._data[attribute][repo] = this._data[attribute][repo] + amount;
        } else {
            throw new Error(`Unsupported attribute type '${attribute}'`);
        }
    }

    get commits() {
        return this._getTotal(UserActivityAttributes.COMMITS);
    }

    get pullRequestComments() {
        return this._getTotal(UserActivityAttributes.PULL_REQUEST_COMMENTS);
    }

    get issues() {
        return this._getTotal(UserActivityAttributes.ISSUES);
    }

    get issueComments() {
        return this._getTotal(UserActivityAttributes.ISSUE_COMMENTS);
    }

    get jsonPayload() {
        const self = this,
            result = {
                login: this.login,
                email: this.email,
                isActive: this.isActive
            };

        Object.values(UserActivityAttributes).forEach(type => {
            result[type] = self._getTotal(type);
        })

        return result;
    }

    _getTotal(attribute) {
        let total = 0;

        if (this._data[attribute]) {
            const values = this._data[attribute];

            Object.keys(values).forEach(repo => {
                total += values[repo];
            });
        }

        return total;
    }
}