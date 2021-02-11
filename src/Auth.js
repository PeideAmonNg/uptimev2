let Auth = {
  getApiKey: function() {
    console.log('Getting api key');
    if(sessionStorage.getItem('apiKey')) {
      return sessionStorage.getItem('apiKey');
    }

    let apiKey = '';
    while(!apiKey) {
      apiKey = prompt("Please enter your api key");
    }

    sessionStorage.setItem('apiKey', apiKey);
    return sessionStorage.getItem('apiKey');
  }
};

export default Auth;  