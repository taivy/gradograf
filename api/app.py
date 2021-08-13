import json
import os
from pathlib import Path

from flask import Flask, jsonify, make_response
from flask_cors import CORS, cross_origin


app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'



DATA_FILE_PATH = 'data.json'


def load_data(file_path):
    p =  Path(file_path)
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


@app.route('/api/devices/track', methods=['GET'])
@cross_origin()
def devices_tracks():
    json_resp = {
        "status": "ok",
        "tracks": data
    }

    response = make_response(jsonify(json_resp))
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



