extends Node
## Band rotation by calendar day, playlist with interludes and breaks. Plays real clips when present; otherwise simulates durations.

signal now_playing(info: Dictionary)
signal queue_finished

var _bands: Array = []
var _queue: Array = []
var _index: int = 0
var _timer: Timer
var _player: AudioStreamPlayer
var _bands_path: String = "res://content/bands.json"


func _ready() -> void:
	_timer = Timer.new()
	_timer.one_shot = true
	add_child(_timer)
	_timer.timeout.connect(_on_segment_finished)
	_player = AudioStreamPlayer.new()
	add_child(_player)
	_player.finished.connect(_on_stream_finished)
	call_deferred("_bootstrap")


func _bootstrap() -> void:
	_load_bands()
	rebuild_queue_for_today()


func _load_bands() -> void:
	if not FileAccess.file_exists(_bands_path):
		push_warning("MusicDirector: missing bands.json")
		return
	var f := FileAccess.open(_bands_path, FileAccess.READ)
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	var root: Dictionary = parsed
	var arr: Variant = root.get("bands", [])
	_bands = arr as Array if typeof(arr) == TYPE_ARRAY else []


func get_band_for_today() -> Dictionary:
	if _bands.is_empty():
		return {}
	var day := DayCycle.get_effective_date_string()
	var i := int(abs(hash(day))) % _bands.size()
	var b: Variant = _bands[i]
	return b as Dictionary if typeof(b) == TYPE_DICTIONARY else {}


func rebuild_queue_for_today() -> void:
	_queue.clear()
	_index = 0
	var band := get_band_for_today()
	if band.is_empty():
		return
	var clips_raw: Variant = band.get("track_clips", [])
	if typeof(clips_raw) != TYPE_ARRAY:
		return
	var clips: Array = clips_raw
	var inter_n := int(band.get("interlude_every_n_tracks", 3))
	var inter_sec := float(band.get("interlude_duration_sec", 2.5))
	var break_n := int(band.get("full_break_every_n_tracks", 6))
	var break_sec := float(band.get("break_duration_sec", 8.0))
	var fallback_dur := float(band.get("track_duration_if_missing_sec", 4.0))
	var songs_since_break := 0
	var track_count := 0
	for c in clips:
		var path := str(c)
		_queue.append({"kind": "track", "path": path, "fallback_sec": fallback_dur, "title": path.get_file()})
		track_count += 1
		songs_since_break += 1
		if inter_n > 0 and track_count % inter_n == 0 and track_count < clips.size():
			_queue.append({"kind": "interlude", "sec": inter_sec, "title": "Interlude"})
		if break_n > 0 and songs_since_break >= break_n:
			_queue.append({"kind": "break", "sec": break_sec, "title": "House break"})
			songs_since_break = 0


func start_if_idle() -> void:
	if _queue.is_empty():
		emit_signal("now_playing", {"title": "(no band data)", "band": "", "kind": "idle"})
		return
	if _timer.is_stopped() and not _player.playing and _index == 0:
		_play_segment(0)


func restart_for_new_day() -> void:
	_timer.stop()
	_player.stop()
	rebuild_queue_for_today()
	start_if_idle()


func _play_segment(i: int) -> void:
	if i >= _queue.size():
		emit_signal("queue_finished")
		_index = 0
		return
	_index = i
	var seg: Dictionary = _queue[i]
	var band := get_band_for_today()
	var band_name := str(band.get("display_name", band.get("id", "Band")))
	emit_signal("now_playing", {"title": seg.get("title", ""), "band": band_name, "kind": seg.get("kind", "")})
	match str(seg.get("kind", "")):
		"track":
			var path := str(seg.get("path", ""))
			if path.is_empty():
				_schedule_fallback(float(seg.get("fallback_sec", 4.0)))
				return
			if ResourceLoader.exists(path):
				var stream: AudioStream = load(path)
				if stream:
					_player.stream = stream
					_player.play()
					return
			_schedule_fallback(float(seg.get("fallback_sec", 4.0)))
		"interlude", "break":
			_timer.start(float(seg.get("sec", 2.0)))
		_:
			_schedule_fallback(1.0)


func _schedule_fallback(sec: float) -> void:
	_timer.start(maxf(0.25, sec))


func _on_stream_finished() -> void:
	_play_segment(_index + 1)


func _on_segment_finished() -> void:
	_play_segment(_index + 1)


func unlock_audio_if_needed() -> void:
	## Call after first user gesture (click) for web export; real streams start from "Enter bar" / playback.
	pass
