function error(methodName) {
    throw new Error(`${methodName} must be implemented!`);
  }
  
  class GitServer {
    constructor(type, token) {
      this.type = type;
      this.token = token;
    }
  
    setToken = () => {
      error('setToken');
    };
    getUser = () => {
      error('getUser');
    };
    getTokenHelpUrl = () => {
      error('getTokenHelpUrl');
    };
    getRemote = () => {
      error('getRemote');
    };
  
    isHttpResponse = (response) => {
      return response && response.status && response.statusText &&
        response.headers && response.data && response.config;
    };
  
    handleResponse = (response) => {
      if (this.isHttpResponse(response) && response !== 200) {
        return null;
      } else {
        return response;
      }
    };
  }

  module.exports = GitServer;