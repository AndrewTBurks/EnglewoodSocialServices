"use strict";

var App = App || {};

let MapView = function(div) {
  let self = {
    map: null,
    serviceLayer: null,
    icons: {},
    iconColors: ["blue", "red", "green", "orange", "yellow", "violet", "grey", "black"]
  };

  init();

  function init() {
    initIcons(); // create icon references for map use

    self.map = L.map(div);
    // create the map layer using data from openstreetmap

    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // normal
    // var osmUrl = 'http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'; // dark
    // var osmUrl = 'http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'; // light

    var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    var osm = new L.TileLayer(osmUrl, {
      minZoom: 11,
      maxZoom: 18,
      attribution: osmAttrib
    });

    self.map.addLayer(osm);
    self.map.setView([41.779786, -87.644778], 15, {
      // reset: true
    });

    self.serviceGroup = L.layerGroup([]).addTo(self.map);

    // causes map to recalculate size... (I shouldn't need to do this)
    setTimeout(function() {
      self.map.invalidateSize();
    }, 0);
  }

  function initIcons() {
    for (let color of self.iconColors) {
      self.icons[color] = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-' + color + '.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
  }

  function plotServices(englewoodLocations) {
    self.serviceGroup.clearLayers();

    // iterate through the social services location file
    for (let loc of englewoodLocations) {
      // convert the X and Y values to lat and lng for clarity
      let lat = loc.Y,
        lng = loc.X;

      // create a marker for each social services location
      L.marker(
        L.latLng(lat, lng), {
          icon: self.icons[self.iconColors[Math.floor(Math.random() * self.iconColors.length)]],
          riseOnHover: true, // moves the marker to the front on mouseover
          opacity: (Math.random() > 0.75 ? 1 : 0.25)
        }
      ).bindPopup(function(layer) { // allow for the popup on click with the name of the location
        return "<strong>" + loc["Organization Name"] + "</strong><br>" +
          loc["Description of Services Provided in Englewood"] + "<br>" +
          "<a href='http://maps.google.com/?q=" + loc["Address"] + "'target='_blank'>Google Maps</a>";
      }).addTo(self.serviceGroup);
    }
  }

  function getMap() {
    return self.map;
  }

  return {
    plotServices,
    getMap
  };
};