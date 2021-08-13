import React, { useEffect } from 'react';
import { Provider, useDispatch } from "react-redux";
import { configureStore } from '@reduxjs/toolkit'

// @ts-ignore
import { taskMiddleware } from "react-palm/tasks";
// @ts-ignore
import KeplerGl from "kepler.gl";
// @ts-ignore
import { addDataToMap } from "kepler.gl/actions";
// @ts-ignore
import keplerGlReducer from "kepler.gl/reducers";

import useSwr from "swr";

import { config as mapConfig } from "./config";



const store = configureStore({
  reducer: {
    keplerGl: keplerGlReducer
  },
  middleware: [taskMiddleware]
})


const App: React.FC = ({}) => {
  return (
    <Provider store={store}>
      <Map />
    </Provider>
  )
}


const Map: React.FC = ({}) => {
  const dispatch = useDispatch();
  const apiUrl = process.env.REACT_APP_API_URL;

  const transformData = (data) => {
    let rows = Array();
    for (let deviceId in data) {
      for (let trackEntry of data[deviceId]) {
        const row = [
          trackEntry['step'],
          trackEntry['temperature'],
          trackEntry['device_timestamp'],
          trackEntry['latitude'],
          trackEntry['longitude'],
          trackEntry['pressure'],
          trackEntry['altitude'],
          trackEntry['humidity'],
          trackEntry['lighting'],
          deviceId
        ]
        rows.push(row);
      }
    }
    return {
      "fields": [
        {"name":"step","format":"","type":"integer"},
        {"name":"temperature","format":"","type":"integer"},
        {"name":"deviceTimestamp","format":"","type":"timestamp"},
        {"name":"latitude","format":"","type":"real"},
        {"name":"longitude","format":"","type":"real"},
        {"name":"pressure","format":"","type":"integer"},
        {"name":"altitude","format":"","type":"integer"},
        {"name":"humidity","format":"","type":"integer"},
        {"name":"lighting","format":"","type":"integer"},
        {"name":"deviceId","format":"","type":"string"},
      ], "rows": rows
    }
  }
  const { data } = useSwr("mapData", async () => {
    const response = await fetch(
      apiUrl + "/api/devices/track"
    );
    const data = await response.json();
    if (data && data['status'] === "ok") {
      return data;
    }
  });

  useEffect(() => {
    if (data) {
      const dataTransformed = transformData(data["tracks"]);
      dispatch(
        addDataToMap({
          datasets: {
            info: {
              label: "Map",
              id: "map"
            },
            data: dataTransformed
          },
          option: {
            centerMap: true,
            readOnly: false
          },
          config: mapConfig
        })
      );
    }
  }, [dispatch, data]);

  return (
    <KeplerGl
      id="map"
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
}

export default App;
