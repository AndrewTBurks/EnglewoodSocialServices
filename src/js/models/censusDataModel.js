"use strict";

var App = App || {};

let CensusDataModel = function() {
  let self = {
    tree: null,

    gridData: null,
    mapTypeNames: null
  };

  self.tree = rbush();

  function loadData() {
    // load mapTypeNames.json as well as allDataGrid.geojson
    let allDataGridP = new Promise(function(resolve, reject) {
      d3.json("./data/allDataGrid.geojson", function(err, json) {
        if (err) reject(err);

        self.gridData = json;

        for(let featureInd in self.gridData.features) {
          // Array<number>: bbox extent in [ minX, minY, maxX, maxY ] order
          let bbox = turf.bbox(self.gridData.features[featureInd]);

          let item = {
              minX: bbox[0],
              minY: bbox[1],
              maxX: bbox[2],
              maxY: bbox[3],
              id: featureInd
          };

          self.tree.insert(item);
        }

        resolve(json);
      });
    });

    let mapTypeNamesP = new Promise(function(resolve, reject) {
      d3.json("./data/mapTypeNames.json", function(err, json) {
        if (err) reject(err);

        self.mapTypeNames = json;

        resolve(json);
      });
    });

    return Promise.all([allDataGridP, mapTypeNamesP]);
  }

  function getSubsetGeoJSON(property, subproperty) {

  }

  function getDataWithinBounds(bounds) {
    let boundData = {};

    let boundsPolygon = turf.polygon([[
      [bounds[0].lng, bounds[0].lat],
      [bounds[0].lng, bounds[1].lat],
      [bounds[1].lng, bounds[1].lat],
      [bounds[1].lng, bounds[0].lat],
      [bounds[0].lng, bounds[0].lat]
    ]]);

    let bbox = turf.bbox(boundsPolygon);

    let intersectingFeatures = self.tree.search({
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3]
    });

    for (let property of Object.keys(self.mapTypeNames)) {
      boundData[property] = {};

      for (let subproperty of self.mapTypeNames[property]) {
        boundData[property][subproperty] = 0;
      }
    }

    for (let item of intersectingFeatures) {
      let feature = self.gridData.features[item.id];
      let intersectPoly = turf.intersect(boundsPolygon, feature);

      if (intersectPoly) {
        let areaRatio = turf.area(intersectPoly)/turf.area(feature);

        for (let property of Object.keys(self.mapTypeNames)) {
          for (let subproperty of self.mapTypeNames[property]) {
            boundData[property][subproperty] += (feature.properties[property][subproperty] * areaRatio);
          }
        }
      }
    }

    return {
      area: turf.area(boundsPolygon),
      dataTotals: boundData
    };
  }

  return {
    loadData,
    getSubsetGeoJSON,
    getDataWithinBounds
  };
};
