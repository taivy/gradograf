// @ts-nocheck

import React, { useEffect, useState, useCallback, createRef } from 'react';
import { Provider, useDispatch } from "react-redux";
import { Button, Modal, Typography, Box, Checkbox, TextField } from '@material-ui/core';
import { configureStore } from '@reduxjs/toolkit'
import Multiselect from 'multiselect-react-dropdown';

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


const TRACKS_LIMIT = 150;


const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};



const App: React.FC = ({}) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  const [devicesMenuModalOpen, setDevicesMenuModalOpen] = useState(false);
  const handleModalClose = () => setDevicesMenuModalOpen(false);

  const [devicesIds, setDevicesIds] = useState(null);
  const [realTimeIsChecked, setRealTimeIsChecked] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const multiselectRef = createRef();


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
      setDevicesIds(data['ids']);
    }
  }

  const showDevicesModal = async () => {
    await fetchDevicesIds();

    console.log("devicesIds", devicesIds)
    setDevicesMenuModalOpen(true);
  }

  const fetchDeviceIdTrack = async (deviceId, isRealTime, startTime, endTime) => {
    const url = new URL(apiUrl + `/devices/${deviceId}/track`);
    const qryParams = { start_t: startTime, end_t: endTime, limit: TRACKS_LIMIT };
    url.search = new URLSearchParams(qryParams).toString();
    const response = await fetch(url);
    if (response.ok) {
      const dataNew = await response.json();
      if (dataNew && dataNew['status'] === "ok") {
        return dataNew;
      }
    } else {
      alert(`Ошибка запроса к бэкенду: ${response.status}`);
    }
    if (isRealTime) {
      // TODO
    }
  }

  const showSelectedTracks = async () => {
    const selectedIds = multiselectRef.current.getSelectedItems();
    const isRealTime = realTimeIsChecked;
    const newData = {};
    for (let deviceId of selectedIds) {
      const deviceTrack = await fetchDeviceIdTrack(deviceId, isRealTime, startTime, endTime);
      newData[deviceId] = deviceTrack[deviceId];
    }

  }

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
          onClick={showDevicesModal}
        >
          Show devices
        </Button>
      </div>
      <Modal
        open={devicesMenuModalOpen}
        onClose={handleModalClose}
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Select devices ids
          </Typography>
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <Multiselect
                options={devicesIds} 
                closeOnSelect={false}
                placeholder={"Select devices ids"}
                showCheckbox={true}
                ref={multiselectRef}
                isObject={false}
                avoidHighlightFirstOption={true}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <TextField
                id="datetime-start"
                label="Start time"
                type="datetime-local"
                //defaultValue="2017-05-24T10:30"
                //sx={{ width: 250 }}
                InputLabelProps={{
                  shrink: true,
                }}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <TextField
                id="datetime-end"
                label="End time"
                type="datetime-local"
                //defaultValue="2017-05-24T10:30"
                //sx={{ width: 250 }}
                InputLabelProps={{
                  shrink: true,
                }}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <Checkbox
                checked={realTimeIsChecked}
                onChange={(e) => setRealTimeIsChecked(e.target.checked)}
              />
              <Typography>
                Show in real-time
              </Typography>
            </div>
            <Button 
              variant="contained" 
              onClick={showSelectedTracks}
            >
              Show tracks
            </Button>
          </div>

        </Box>
      </Modal>

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
      apiUrl + `/devices/track?limit=${TRACKS_LIMIT}`
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
      setTimeout(() => fetchData(), 100000)

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
