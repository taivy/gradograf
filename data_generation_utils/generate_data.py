import random
import json
import uuid
from collections import defaultdict


DATA_FILE_PATH = 'data.json'


def generate_data(data_file_path):
	desired_points_cnt = 100000
	points_counter = 0
	current_device_tracks_cnt = 0
	current_device_max_tracks = 0


	min_device_tracks = 10
	max_device_tracks = 150


	step_increase = 10


	min_latitude = 51
	max_latitude = 65

	min_longitude = 33
	max_longitude = 62

	min_coord_increase = -0.000015
	max_coord_increase = 0.000015


	min_timestamp = 1604000000
	max_timestamp = 1604526766

	min_ts_increase = 100
	max_ts_increase = 10000


	min_temperature = -10
	max_temperature = 35

	min_temp_increase = -5
	max_temp_increase = 5


	min_pressure = 900
	max_pressure = 1000

	min_pressure_increase = -15
	max_pressure_increase = 15


	min_altitude = 10
	max_altitude = 200

	min_altitude_increase = -15
	max_altitude_increase = 15


	min_humidity = 50
	max_humidity = 80

	min_humidity_increase = -10
	max_humidity_increase = 10


	min_lighting = 0
	max_lighting = 20

	min_lighting_increase = -2
	max_lighting_increase = 2


	data = defaultdict(list)

	while points_counter < desired_points_cnt:
		if current_device_tracks_cnt >= current_device_max_tracks:
			current_device_id = uuid.uuid4().hex
			current_device_max_tracks = random.randint(min_device_tracks, max_device_tracks)
			current_device_tracks_cnt = 0
			current_step = 0
			current_latitude = random.uniform(min_latitude, max_latitude)
			current_longitude = random.uniform(min_longitude, max_longitude)
			current_timestamp = random.randint(min_timestamp, max_timestamp)
			current_temperature = random.randint(min_temperature, max_temperature)
			current_pressure = random.randint(min_pressure, max_pressure)
			current_altitude = random.randint(min_altitude, max_altitude)
			current_humidity = random.randint(min_humidity, max_humidity)
			current_lighting = random.randint(min_lighting, max_lighting)

		point_data = {
			"step": current_step,
			"latitude": current_latitude,
			"longitude": current_longitude,
			"device_timestamp": current_timestamp,
			"temperature": current_temperature,
			"pressure": current_pressure,
			"altitude": current_altitude,
			"humidity": current_humidity,
			"lighting": current_lighting,
		}

		data[current_device_id].append(point_data)

		points_counter += 1
		current_device_tracks_cnt += 1
		current_step += step_increase
		current_latitude -= 0.0000015
		#current_longitude += random.uniform(min_coord_increase, max_coord_increase)
		current_timestamp += random.randint(min_ts_increase, max_ts_increase)
		current_temperature += random.randint(min_temp_increase, max_temp_increase)
		current_pressure += random.randint(min_pressure_increase, max_pressure_increase)
		current_altitude += random.randint(min_altitude_increase, max_altitude_increase)
		current_humidity += random.randint(min_humidity_increase, max_humidity_increase)
		current_lighting += random.randint(min_lighting_increase, max_lighting_increase)

	with open(DATA_FILE_PATH, 'w') as f_obj:
		json.dump(data, f_obj)



if __name__ == "__main__":
	generate_data(DATA_FILE_PATH)
