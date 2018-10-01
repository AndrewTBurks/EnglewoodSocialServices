/* global L MarkerViewController MapView LotDataModel MapIconModel */

// eslint-disable-next-line no-unused-vars
class LotViewController {
  constructor ({
    mapView = new MapView(),
    lotModel = new LotDataModel(),
    mapIconModel = new MapIconModel(),
    lotMarkerTypeDropdownSelector = '#lot-type-view-toggle-group'
  }) {
    this._mapView = mapView;
    this._lotModel = lotModel;
    this._mainMarkerController = null;
    this._mapIconModel = mapIconModel;
    this._lotTypeDropdown = document.querySelector(lotMarkerTypeDropdownSelector);
    this._markerControllers = {};

    this._mapView.addClusterGroup(LotViewController.layerGroupName, {
      showCoverageOnHover: false,
      disableClusteringAtZoom: 18
    });

    this._lotModel.lotTypes.forEach(type => {
      this._markerControllers[type] = null;
      this._mapView.addClusterSubGroup(LotViewController.layerGroupName, type);
    });
  }

  static get layerGroupName () {
    return 'lotMarkers';
  }

  getLayerGroupNameByType (zoneType) {
    return this._lotModel.lotTypes.includes(zoneType)
      ? `${LotViewController.layerGroupName}--${zoneType}`
      : undefined;
  }

  init (mainMarkerController = new MarkerViewController(), lotControllersByType = {}) {
    this._mainMarkerController = mainMarkerController;
    this._mainMarkerController.addPreUpdateEventHandler(LotViewController.layerGroupName, (isShowing) => {
      this.updateAllViews(isShowing);
    });
    this._lotModel.lotTypes.forEach(type => {
      this._markerControllers[type] = lotControllersByType[type];
      this._markerControllers[type].addPreUpdateEventHandler(this.getLayerGroupNameByType(type), (isShowing) => {
        this.updateViewsByType(isShowing, type);
      });
    });

    this._initMapMarkers();
  }

  _generateLotPopupHtml (lot) {
    return [
      `<strong>${lot.Location}</strong>`,
      `<b>Size: </b> ${lot['Sq. Ft.']} sq. ft.`,
      `<b>Zone Classification:</b> ${this._lotModel.getZoneClassification(lot, true)}`,
    ].join('<br>');
  }

  _markerGenerator (lot, map) {
    const zoneType = this._lotModel.getZoneClassification(lot);

    const marker = L.marker(
      L.latLng(+lot.Latitude, +lot.Longitude),
      {
        icon: this._mapIconModel.getIconById(zoneType !== 'Other' ? zoneType : 'lotMarker'),
        riseOnHover: true,
        data: lot
      }
    ).bindPopup(
      this._generateLotPopupHtml(lot),
      { autoPan: false }
    ).on('click', () => {
      console.debug(lot);
      map.closePopup();
    }).on('mouseover', function () {
      marker.openPopup();
    }).on('mouseout', function () {
      if (!this.options.data.expanded) {
        map.closePopup();
      }
    });
    return marker;
  }

  _initMapMarkers () {
    const data = this._lotModel.getData();

    this._mapView.updateClusterGroup(LotViewController.layerGroupName, (group, map, getClusterSubGroup) => {
      data.forEach(lot => {
        const zoneType = this._lotModel.getZoneClassification(lot);
        const marker = this._markerGenerator(lot, map);
        const typeGroup = getClusterSubGroup(zoneType);
        marker.addTo(typeGroup);
      });
    });
  }

  get _hasAnyMarkersShowing () {
    return Object.values(this._markerControllers).some(c => c.viewState);
  }

  updateAllViews (showMarkers) {
    this._lotTypeDropdown.style.display = showMarkers ? '' : 'none';

    this._mapView.setClusterGroupVisibility(LotViewController.layerGroupName, showMarkers);

    if (!this._hasAnyMarkersShowing) {
      Object.keys(this._markerControllers).forEach(type => {
        this._markerControllers[type].toggle(showMarkers);
      });
    }
  }

  updateViewsByType (showMarkers, type) {
    this._mapView.setClusterSubGroupVisibility(LotViewController.layerGroupName, type, showMarkers);

    if (showMarkers && !this._mainMarkerController.viewState) {
      this._mainMarkerController.toggle(true);
    }
  }
}