import json
import os
from pathlib import Path

from flask import Flask, jsonify, make_response, request
from flask_cors import CORS, cross_origin


app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


tracks_n_real_time = 0


DATA_FILE_PATH = 'data.json'


def load_data(file_path):
    p = Path(file_path)
    if not p.exists():
        print("Data file not found, exiting!")
        os.exit(1)
    try:
        with open(file_path, 'r') as f_obj:
            data = json.load(f_obj)
        return data
    except json.JSONDecodeError:
        print("Data file contains invalid json")


data = load_data(DATA_FILE_PATH)

# note: in normal backend shouldn't store in global variable, would query from db


@app.route('/api/devices/id', methods=['GET'])
@cross_origin()
def devices_id():
    json_resp = {
        "status": "ok",
        "ids": list(data.keys())
    }

    response = make_response(jsonify(json_resp))
    return response

#device_id: device_tracks[0]
@app.route('/api/devices/track', methods=['GET'])
@cross_origin()
def devices_tracks():
    global tracks_n_real_time

    limit = request.args.get('limit', None)

    if limit is not None:
        limit = int(limit)
        limited_data = dict()
        left_i = tracks_n_real_time
        right_i = tracks_n_real_time + limit
        for device_id, device_tracks in data.items():
            #limited_data[device_id] = device_tracks[-limit:]
            limited_data[device_id] = device_tracks[left_i:right_i]

    json_resp = {
        "status": "ok",
        "tracks": limited_data
    }

    response = make_response(jsonify(json_resp))

    tracks_n_real_time += 1
    if tracks_n_real_time > limit - 15:
    	tracks_n_real_time = 0
    return response


@app.route('/api/devices/position', methods=['GET'])
@cross_origin()
def devices_positions():
    positions = {device_id: device_tracks[0] for device_id, device_tracks in data.items()}
    json_resp = {
        "status": "ok",
        "positions": positions
    }

    response = make_response(jsonify(json_resp))
    return response


@app.route('/api/devices/<device_id>/track', methods=['GET'])
@cross_origin()
def device_track(device_id):
    device_track_data = data.get(device_id, None)
    if device_track_data is None:
        message = {
            "status": "error",
            "tracks": []
        }
        return make_response(jsonify(message), 404)
    json_resp = {
        "status": "ok",
        device_id: device_track_data
    }

    response = make_response(jsonify(json_resp))
    return response


@app.route('/api/devices/<device_id>/position', methods=['GET'])
@cross_origin()
def device_position(device_id):
    device_track_data = data.get(device_id, None)
    if device_track_data is None or len(device_track_data) == 0:
        message = {
            "status": "error",
            "tracks": []
        }
        return make_response(jsonify(message), 404)

    device_position_data = device_track_data[0]
    json_resp = {
        "status": "ok",
        device_id: device_position_data
    }

    response = make_response(jsonify(json_resp))
    return response



