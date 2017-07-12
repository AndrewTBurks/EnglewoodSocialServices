"use strict";

var App = App || {};

let SocialServiceModel = function() {
  let self = {
    data: null
  };

  init();

  function init() {

  }

  function loadData(dataPath) {
    return new Promise(function(resolve, reject) {
      d3.csv(dataPath, function(err, data) {
        if (err) reject(err);

        self.data = data;
        resolve();
      })
    });
  }

  function getData() {
    return self.data;
  }

  function getFilteredData(serviceFilters) {
    if (Object.keys(serviceFilters).length == 0) {
      return self.data;
    }

    return _.filter(self.data, function(el) {
      for (let property of Object.keys(serviceFilters)) {
        if (el[property] == 1) {
          return true;
        }
      }

      return false;
    });
  }

  // just searching by name for now
  function getSearchedData(term) {

    if (term.length === 0) {
      return self.data;
    }

    let termToLower = _.lowerCase(term);

    return _.filter(self.data, el => _.includes(_.lowerCase(el["Organization Name"]), termToLower));
  }

  return {
    loadData,
    getData,
    getFilteredData,
    getSearchedData
  };
};
