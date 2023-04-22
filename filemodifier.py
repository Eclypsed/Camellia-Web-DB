import os
import json

for json_file in os.listdir("json_folder"):
    with open(f"json_folder/{json_file}", 'r', encoding='UTF-8') as opened_file:
        data = json.load(opened_file)

        variations = data["variations"]

        game_appearances = data["gameAppearances"]
        albums = data["albums"]

        if not albums and not game_appearances:
            release = input(f"Please enter the release for {data['name']}")
        else:
            first_releases = []
            if albums is not None:
                date_sorted_albums = sorted(key=lambda x:x["albumReleaseDate"])
                first_releases.append(date_sorted_albums[0])
            if game_appearances is not None:
                date_sorted_games = sorted(key=lambda x:x["gameReleaseDate"])
