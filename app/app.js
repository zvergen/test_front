'use strict';

angular.module('testApp', [
  'ngRoute',
  'ngResource',
  'ngCookies',
  'ngSanitize',
  'ui.tree',
  'angularModalService'
])
  .constant('BASE_URL', {
    server: "http://localhost:8080",
    pathData: "/view/rest/element/",
    authData: "/view/rest/auth"
  })
  .factory('elementsResource', ['$resource', 'BASE_URL',
    function ($resource, BASE_URL) {
      return $resource(BASE_URL.server + BASE_URL.pathData + ':id', {id: '@id'},
        {
          query: {method: 'GET', isArray: true, withCredentials: true},
          create: {method: 'POST', withCredentials: true},
          save: {method: 'PUT', withCredentials: true},
          delete: {method: 'DELETE', withCredentials: true}
        });
    }
  ])
  .factory('authResource', ['$resource', 'BASE_URL',
    function ($resource, BASE_URL) {
      return $resource(BASE_URL.server + BASE_URL.authData,
        {},
        {
          login:
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
        });
    }
  ])
  .factory('authFactory', ['authResource', '$log', '$cookies',
    function (authResource, $log, $cookies) {
      var auth = {};

      auth.login = function (_login, _password) {
        var formString = "login=" + _login + "&password=" + _password;
        $log.debug('### Sending LOGIN request ###');
        authResource.login(formString).$promise.then(
          function (response) {
            $log.debug('### Checking status ###');
            if (response.status == 'success') {
              $log.debug('### LOGIN SUCCESS ###');
              $cookies.put('sessionToken', response.sessionToken, {'path': '/'});
            } else {
              $log.debug(response.status);
            }
          }
        )
      };

      return auth;
    }
  ])
  .config(['$locationProvider', '$routeProvider', '$logProvider',
    function ($locationProvider, $routeProvider, $logProvider) {
      $locationProvider.html5Mode(true);
      $logProvider.debugEnabled(true);

      $routeProvider
        .when('/home', {
          templateUrl: '/test_front/view/homeTreeView.html',
          controller: 'HomeTreeCtrl',
          resolve: {
            token: function ($cookies, $location, $q, $log) {
              $log.debug('### Check token ###');
              var token = $cookies.get('sessionToken');
              if (token) {
                $log.debug('Token found');
                return token;
              } else {
                $location.path('/auth');
                $log.debug('Need login. Redirecting to /auth');
                return $q.reject({unAuthorized: true});
              }
            },
            data: function (elementsResource, $log) {
              $log.debug('### Loading tree ###');
              return elementsResource.query().$promise.then(
                function (value) {
                  $log.debug('Tree loaded');
                  return value;
                }, function (reason) {
                  $log.debug('Cannot load tree data ### ' + reason.status);
                }
              );
            }
          }
        })
        .when('/edit/:id', {
          templateUrl: '/test_front/view/editorView.html',
          controller: 'editCtrl',
          resolve: {
            token: function ($cookies, $location, $q, $log) {
              $log.debug('### Check token ###');
              var token = $cookies.get('sessionToken');
              if (token) {
                $log.debug('Token found');
                return token;
              } else {
                $location.path('/auth');
                $log.debug('Need login. Redirecting to /auth');
                return $q.reject({unAuthorized: true});
              }
            }
          }
        })
        .when('/create/:parentId', {
          templateUrl: '/test_front/view/createView.html',
          controller: 'createCtrl',
          resolve: {
            token: function ($cookies, $location, $q, $log) {
              $log.debug('### Check token ###');
              var token = $cookies.get('sessionToken');
              if (token) {
                $log.debug('Token found');
                return token;
              } else {
                $location.path('/auth');
                $log.debug('Need login. Redirecting to /auth');
                return $q.reject({unAuthorized: true});
              }
            }
          }
        })
        .when('/auth', {
          templateUrl: '/test_front/view/authView.html'
        })
        .otherwise({
          redirectTo: '/home',
          resolve: {
            token: function ($cookies, $location, $q, $log) {
              $log.debug('### Check token ###');
              var token = $cookies.get('sessionToken');
              if (token) {
                $log.debug('Token found');
                return token;
              } else {
                $location.path('/auth');
                $log.debug('Need login. Redirecting to /auth');
                return $q.reject({unAuthorized: true});
              }
            }
          }
        });
    }
  ])
  .controller('modalConfirmCtrl', ['$scope', 'question', 'close',
    function ($scope, question, close) {
      $scope.question = question;

      $scope.close = function (result) {
        close(result, 500);
      }
    }
  ])
  .controller('defaultCtrl', ['$scope', '$location', '$log', '$interval', '$cookies', 'authFactory',
    function ($scope, $location, $log, $interval, $cookies, authFactory) {
      $scope.data = {};

      $scope.authState = {
        isAuthorized: false,
        token: null,
        message: false
      };

      $scope.credential = {
        login: null,
        password: null
      };

      $scope.login = function () {
        $log.debug('### LOGIN IN ###');
        $scope.authState.message = false;
        authFactory.login($scope.credential.login, $scope.credential.password);
        $interval(checkAuth, 2000, 1);
      };

      function checkAuth() {
        $log.debug('Getting token...');
        var token = $cookies.get('sessionToken');
        if (token != null) {
          $scope.authState.token = token;
          $scope.authState.isAuthorized = true;
          $log.debug('Token gained. Redirecting to /home');
          $location.path('/home');
        } else {
          $log.debug('### LOGIN Failed. Please try again ###');
          $scope.authState.message = true;
        }
      }

    }
  ]);

