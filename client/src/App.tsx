// @ts-nocheck

import React, { useEffect, useState, useCallback } from 'react';
import { Provider, useDispatch } from "react-redux";
import { Button } from '@material-ui/core';
import { configureStore } from '@reduxjs/toolkit'

// @ts-ignore
import { taskMiddleware } from "react-palm/tasks";
// @ts-ignore
import KeplerGl from "kepler.gl";
// @ts-ignore
import { addDataToMap } from "kepler.gl/actions";
// @ts-ignore
import keplerGlReducer from "kepler.gl/reducers";
// @ts-ignore
import KeplerGlSchema from 'kepler.gl/schemas';

import { config as mapConfig } from "./config";



const store = configureStore({
  reducer: {
    keplerGl: keplerGlReducer
  },
  middleware: [taskMiddleware]
})


const App: React.FC = ({}) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchDevicesIds = async () => {
    const response = await fetch(
      apiUrl + "/devices/id"
    );
    if (!response.ok) {
      alert(`Ошибка запроса к бэкенду: ${response.status}`);
      return
    }
    const data = await response.json();
    if (data && data['status'] === "ok") {
      return data['ids']
    }
  }

  const btnClickHandler = useCallback(async () => {
    const devicesIds = await fetchDevicesIds();
    console.log("devicesIds", devicesIds)

  }, [])


  return (
    <div style={{
      position: 'relative'
    }}>
      <Provider store={store}>
        <Map />
      </Provider>
      
      <div style={{
        position: 'absolute',
        right: '70px',
        top: '20px',
        zIndex: '1000',
      }}>
        <Button 
          variant="contained" 
          onClick={btnClickHandler}
        >
          Show devices
        </Button>
      </div>
    </div>
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


  const [data, setData] = useState(null);

  const fetchData = async () => {
    const response = await fetch(
      apiUrl + "/devices/track?limit=150"
    );
    if (response.ok) {
      const dataNew = await response.json();
      if (dataNew && dataNew['status'] === "ok") {
        setData(dataNew);
      }
    } else {
      alert(`Ошибка запроса к бэкенду: ${response.status}`);
    }

  }

  useEffect(() => {
  	fetchData();
  }, []);

  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isFirstStart, setIsFirstStart] = useState(true);

  const getConfig = (isFirstRender) => {
	  if (isFirstRender) {
	  	return mapConfig;
	  } else {
	  	try {
	  		return KeplerGlSchema.getConfigToSave();
	  	} catch(e) {
	  		//console.log(e);
	  		return mapConfig;
	  	}
	  	
	  }
  }


  /*
  const f = useCallback(() => {
  	console.log("data", data)
    if (data) {
      const dataTransformed = transformData(data["tracks"]);
      let mapConfigToLoad = getConfig(isFirstRender)

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
          config: mapConfigToLoad
        })
      );
      setIsFirstRender(false);

    }
    fetchData()
    //setTimeout(f, 5000);
  }, [data, isFirstRender, dispatch])


  const starter = () => {
  	f();
  	setTimeout(starter, 5000);
  }


  if (isFirstStart) {
		//f();
		starter();
		setIsFirstStart(false);
  }
  */

  useEffect(() => {
  	console.log("data", data)
    if (data) {
      const dataTransformed = transformData(data["tracks"]);
      setTimeout(() => fetchData(), 1000)

      let mapConfigToLoad = getConfig(isFirstRender)

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
          config: mapConfigToLoad
        })
      );
      setIsFirstRender(false);

    }
  	//fetchData()
    //setTimeout(f, 5000);
  }, [data, isFirstRender, dispatch, transformData])


  return (
      <KeplerGl
        style={{
          position: 'relative',
          top: 0,
          left: 0
        }}
        id="map"
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        width={window.innerWidth}
        height={window.innerHeight}
      />
  );
}

export default App;
