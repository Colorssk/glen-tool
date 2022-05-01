const GitServer = require('./GitServer');
const GitLabRequest = require('./gitlabRequest');

class Gitlab extends GitServer {
  constructor() {
    super('gitlab');
  }

  // http://gitlab.sumscope.com/api/v4/personal_access_tokens?access_token=5RJCwwrsRyX8vRzLgeSM 能够获取到userid 此后就可以获取到user repo等相关信息

  getTokenHelpUrl = () => {
    return 'https://www.csdn.net/tags/NtjaAg4sODQyNzgtYmxvZwO0O0OO0O0O.html';
  };

  getUserId = (token) => {
    return this.request.get(`/personal_access_tokens?access_token=${token}`).then(response => {
      return this.handleResponse(response);
    });
  }

  getUser = (id,token) => {
    // http://gitlab.sumscope.com/api/v4/users/:id/?access_token=5RJCwwrsRyX8vRzLgeSM
    return this.request.get(`/users/${id}/?access_token=${token}`).then(response => {
      return this.handleResponse(response);
    });
  };

  setToken = (token) => {
    this.request = new GitLabRequest(token);
  };
  // http://gitlab.sumscope.com/api/v4/projects/?access_token=5RJCwwrsRyX8vRzLgeSM&owned=true&search=history
  getRepo = (repo) => {
    return this.request.get(`projects/?owned=true&search=${repo}`).then(response => {
      return this.handleResponse(response.filter(e=>e.name === repo)[0]);
    });
  };
  getSSHKeysUrl = () => {
    return 'http://gitlab.sumscope.com/-/profile/keys';
  };
  getSSHKeysHelpUrl = () => {
    return 'https://blog.csdn.net/qq_41621896/article/details/118569844'
  }

  // get branches
  getBranches = (projectId) => {
    //http://gitlab.sumscope.com/api/v4/projects/1269/repository/branches?access_token=5RJCwwrsRyX8vRzLgeSM
    return this.request.get(`projects/${projectId}/repository/branches`).then(response => {
      return this.handleResponse(response);
    });
  }

  // api: https://docs.gitlab.com/ee/api/merge_requests.html#create-mr
  creareMergeRequest = (projectId, data) => {
    // /projects/:id/merge_requests
    return this.request.post(`/projects/${projectId}/merge_requests`, data).then(response => {
      return this.handleResponse(response);
    });
  }
}

module.exports = Gitlab;
