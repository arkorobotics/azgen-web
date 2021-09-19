<template>
  <div>
    <nav class="navbar navbar-expand-sm bg-dark navbar-dark" style="height: 40px;line-height: 0.5">
      <a class="navbar-brand p-2" href="#">SOTA Activation Zone Estimator</a>
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link p-2">By: N6ARA</a>
        </li>
      </ul>
    </nav>
    <div class="container-fluid" style="padding: 0px; border:0px">
      <div class="row">
        <div id="app" class="col-sm-4">
          <div  id="polygontext" style="padding: 10px; border:0px">
            <form id="form" v-on:submit.prevent="lookupSummit">
              <label for="sotaref" style="padding-right: 10px;">SOTA REF:</label>
              <input id="sotaref" name="sotaref" value="W6/CT-225">
              {{lu_msg}}<br>
              <input type="submit" class="btn btn-primary" value="Lookup Summit"><br><br>
            </form>
            <form id="form" v-on:submit.prevent="calcAZ">
              <label for="lat" style="padding-right: 10px;">Latitude (deg):</label>
              <input type="number" step="any" min="-90.000" max="90.000" id="lat" name="lat" value="34.1636" required><br>
              <label for="long" style="padding-right: 10px;">Longitude (deg):</label>
              <input type="number" step="any" min="-180.000" max="180.000"  id="long" name="long" value="-118.1967" required><br>
              <label for="alt" style="padding-right: 10px;">SOTA Altitude (m):</label>
              <input type="number" step="any" min="0.0" max="9000.000"  id="alt" name="alt" value="576" required><br>
              <input type="submit" class="btn btn-primary" value="Calculate AZ">
              <br><br>
              <div v-show="isGenerating" class="spinner-border text-primary" role="status">
                <span class="sr-only"></span>
              </div>
              Estimated Computation Time: ~1 min
              <textarea id="wktStringTextArea" class="form-control" rows="4" @click="restoreDefaultColors()" v-model="info">
              </textarea>
              <button type="button" class="btn btn-primary" @click="plotWKT()">Plot AZ</button><br>
            </form>
          </div>
        </div>
        <div class="col-sm-8">
          <div id="map" class="map" style="z-index: 0"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>


// TODOs:
// - Double check that we don't need any polyfills - should be taken care of by browserslist, but might need some extra configuration


import axios from 'axios';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import Collection from 'ol/Collection';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Map from 'ol/Map';
import View from 'ol/View';
import WKT from 'ol/format/WKT';
import Draw from 'ol/interaction/Draw';

export default {
  name: 'App',
  data: function() {
    let features = new Collection();
    let fill = new Fill({
      color: 'rgba(210, 122, 167,0.2)'
    });
    let stroke = new Stroke({
      color: '#B40404',
      width: 2
    });
    let styles = [
      new Style({
        image: new CircleStyle({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        stroke: stroke
      })
    ];
    let vector = new VectorLayer({
      source: new VectorSource({ features: features }),
      style: styles
    });
    return {
      info: null,
      map: null,
      currentShape: 'point',
      fill: fill,
      features: features,
      styles: styles,
      draw: null,
      format: new WKT(),
      vector: vector,
      isGenerating: false,
      lu_msg: ''
    };
  },
  mounted: function() {
    let raster = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      })
    })
    this.map = new Map({
      layers: [raster, this.vector],
      target: 'map',
      view: new View({
        center: [-11000000, 4600000],
        zoom: 4
      })
    });
    // eslint-disable-next-line
    this.features.on("add", (e) => {
      this.restoreDefaultColors();
      this.features.forEach(this.toEPSG4326);
      document.getElementById('wktStringTextArea').value = this.format.writeFeatures(this.features.getArray(), { rightHanded: true });
      this.features.forEach(this.toEPSG3857);
    });
    this.plotWKT();
    this.selectGeom('Point');
  },
  methods: {
    // eslint-disable-next-line
    toEPSG4326: function(element, index, array) {
      element = element.getGeometry().transform('EPSG:3857', 'EPSG:4326');
    },
    // eslint-disable-next-line
    toEPSG3857: function(element, index, array) {
      element = element.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    },
    restoreDefaultColors: function() {
      document.getElementById("wktStringTextArea").style.borderColor = "";
      document.getElementById("wktStringTextArea").style.backgroundColor = "";
    },
    addInteraction: function(shape) {
      this.draw = new Draw({
        features: this.features,
        type: /** @type {ol.geom.GeometryType} */ shape
      });
      this.map.addInteraction(this.draw);
    },
    selectGeom: function(shape) {
      this.currentShape = shape;
      this.map.removeInteraction(this.draw);
      this.addInteraction(shape);
    },
    plotWKT: function() {
      // Plot WKT string on map
      let newFeature;
      let wkt_string = document.getElementById("wktStringTextArea").value;
      if (wkt_string == "") {
        document.getElementById("wktStringTextArea").style.borderColor = "black";
        document.getElementById("wktStringTextArea").style.backgroundColor = "#FFFFFF";
        return;
      } else {
        try {
          newFeature = this.format.readFeature(wkt_string);
        } catch (err) {
          console.log('Error on plotWKT', err);
        }
      }
      if (!newFeature) {
        document.getElementById("wktStringTextArea").style.borderColor = "green";
        document.getElementById("wktStringTextArea").style.backgroundColor = "#EAF7E8";
        return;
      } else {
        this.map.removeLayer(this.vector);
        this.features.clear();
        newFeature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
        this.features.push(newFeature);
      }
      this.vector = new VectorLayer({
        source: new VectorSource({ features: this.features }),
        style: this.styles
      });
      this.selectGeom(this.currentShape);
      this.map.addLayer(this.vector);
      
      let derivedFeature = this.features.getArray()[0];
      let extent = derivedFeature.getGeometry().getExtent();
      let minX = derivedFeature.getGeometry().getExtent()[0];
      let minY = derivedFeature.getGeometry().getExtent()[1];
      let maxX = derivedFeature.getGeometry().getExtent()[2];
      let maxY = derivedFeature.getGeometry().getExtent()[3];
      let centerX = (minX + maxX) / 2;
      let centerY = (minY + maxY) / 2;
      this.map.setView(new View({
        center: [centerX, centerY],
        zoom: 8
      }));
      this.map.getView().fit(extent, this.map.getSize());
    },
    calcAZ: function () {
      this.isGenerating = true;
      let lat = document.getElementById('lat').value;
      let long = document.getElementById('long').value;
      let alt = document.getElementById('alt').value;
      let data = {
        "summit_ref": "W6SC229",
        "summit_lat": lat,
        "summit_long": long,
        "summit_alt": alt,
        "deg_delta": 0.040,
        "sota_summit_alt_thres": 25
      }
      axios
        //.post('http://localhost:8082', data)
        .post('https://api.activation.zone', data)
        .then(response => {
          this.info = response.data.az
        })
        .catch(error => {
          this.info = error
        })
        .then( () => { this.isGenerating = false })
    },
    lookupSummit: function () {
      this.isGenerating = true;
      let sotaref = document.getElementById('sotaref').value;
      let isDataAvailable = "";
      axios
        .get('https://api2.sota.org.uk/api/summits/' + sotaref)
        .then(response => {
          isDataAvailable = response.data.length;
          document.getElementById('lat').value = response.data.latitude,
          document.getElementById('long').value = response.data.longitude,
          document.getElementById('alt').value = response.data.altM
          this.lu_msg = ""
        })
        .catch(error => {
          this.lu_msg = error
        })
        .then( () => { this.isGenerating = false })
        .finally(() => {
            if(isDataAvailable == 0)  {
              this.lu_msg = "Summit Not found. Remember to include / and - in the SOTA REF"
            }
        })
    }
  }
}

</script>
<style>
  body {
    font-family: Helvetica, Arial, sans-serif;
  }

  ul {
    padding: 0;
  }

  .user {
    height: 30px;
    line-height: 30px;
    padding: 10px;
    border-top: 1px solid #eee;
    overflow: hidden;
    transition: all .25s ease;
  }

  .user:last-child {
    border-bottom: 1px solid #eee;
  }

  .v-enter, .v-leave-to {
    height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-top-width: 0;
    border-bottom-width: 0;
  }

  .errors {
    color: #f00;
  }
  .map {
    width: 100%;
    height:600px;
  }

</style>
