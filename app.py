from flask import Flask, render_template, url_for, redirect, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, LoginManager, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from dotenv import load_dotenv
import os
import json

app = Flask(__name__)
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
app.secret_key = SECRET_KEY
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
APP_ROUTE = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROUTE, 'static', 'images')
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
SESSION_TYPE = 'filesystem'
app.config.from_object(__name__)
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

class Objects(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String, nullable=False)
    url = db.Column(db.String, nullable=False, unique=True)
    altNames = db.Column(db.PickleType, default = None)
    artists = db.Column(db.PickleType, default = None)
    songType = db.Column(db.String, default = None)
    touhouOrigin = db.Column(db.PickleType, default = None)
    originalSong = db.Column(db.PickleType, default = None)
    duration = db.Column(db.String, default = None)
    albums = db.Column(db.PickleType, default = None)
    gameAppearances = db.Column(db.PickleType, default = None)
    links = db.Column(db.PickleType, default = None)
    imgs = db.Column(db.PickleType, default = None)
    description = db.Column(db.String, default = None)
    variations = db.Column(db.PickleType, default = None)

class Admin(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    adminname = db.Column(db.String, nullable=False, unique=True)
    password = db.Column(db.String, nullable=False)

with app.app_context():
    db.create_all()


with app.app_context():
    # LOADS DATA FROM JSON FILES FOLDER
    # for file in os.listdir('json_data'):
    #     json_file = open(f'json_data/{file}', encoding='UTF-8')
    #     data = json.load(json_file)
    #     db_data = Objects(**data)
    #     exists = Objects.query.filter_by(url=data['url']).scalar() is not None
    #     if exists is False:
    #         db.session.add(db_data)
    #         db.session.commit()
    #         print(f"Added {data['name']}")
    #     json_file.close()
    ADMIN_NAME = os.getenv("ADMIN_NAME")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
    if Admin.query.filter_by(adminname=ADMIN_NAME).first() is None:
        admin = Admin(adminname=ADMIN_NAME, password=generate_password_hash(ADMIN_PASSWORD))
        db.session.add(admin)
        db.session.commit()
        print(f"Added Admin")

@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    return redirect(url_for('admin_login'))


@app.route("/", methods=['POST', 'GET'])
def home():
    with open("miscellaneous.txt", "r", encoding="UTF-8") as f:
        miscSongs = f.read().splitlines()
    return render_template("home.html", miscSongs=miscSongs)

@app.route("/discography", methods=['POST', 'GET'])
def discography():
    original_songs = []
    remixes = []
    unsortted = []
    for song in Objects.query.with_entities(Objects.name, Objects.imgs, Objects.url, Objects.songType):
        if song[1] is None:
            primary_image = 'assets/Placeholder.png'
        else:
            primary_image = f'images/{song[1][0]["filename"]}'
        if song[3] is None:
            unsortted.append([song[0], url_for('static', filename=primary_image), song[2]])
        elif song[3].find('Remix') != -1:
            remixes.append([song[0], url_for('static', filename=primary_image), song[2]])
        else:
            original_songs.append([song[0], url_for('static', filename=primary_image), song[2]])
    original_songs.sort(key=lambda x:str(x[2]).replace('-', '').lower())
    if request.method == 'POST':
        if 'songblock' in request.form:
            return redirect(f"track/{request.form.get('songblock')}")
    return render_template("discography.html", original_songs=original_songs, remixes=remixes, unsortted=unsortted)

@app.route("/track/<url>", methods=['POST', 'GET'])
def track(url):
    if request.method == 'POST':
        if 'change-song' in request.form:
            newUrl = request.form.get('change-song')
            if newUrl == url:
                return redirect(f"/track/{url}")
            else:
                return redirect(f"/track/{url}/{request.form.get('change-song')}")
    try:
        song = Objects.query.filter_by(url=f"{url}").one()
    except:
        return f'Error: Route \"{url}\" is not a valid url'
    return render_template("songpage.html", name=song.name, url=song.url, altNames=song.altNames, artists=song.artists, touhouOrigin=song.touhouOrigin,
    songType=song.songType, originalSong=song.originalSong, duration=song.duration, albums=song.albums, gameAppearances=song.gameAppearances,
    links=song.links, imgs=song.imgs, description=song.description, variations=song.variations, primarySong=song.name, primaryUrl=song.url)

@app.route("/track/<url>/<suburl>", methods=['POST', 'GET'])
def subtrack(url, suburl):
    try:
        originalSong = Objects.query.filter_by(url=f"{url}").one()
        variationUrls = []
        for variation in originalSong.variations:
            variationUrls.append(variation["url"])
        if suburl not in variationUrls:
            return f'Error: Route \"{url}/{suburl}\" is not a valid url'
        else:
            song = originalSong.variations[variationUrls.index(suburl)]
    except:
        return f'Error: Route \"{url}\" is not a valid url'
    return render_template("songpage.html", name=song["name"], url=song["url"], altNames=song["altNames"], artists=song["artists"], touhouOrigin=song["touhouOrigin"],
    songType=song["songType"], originalSong=song["originalSong"], duration=song["duration"], albums=song["albums"], gameAppearances=song["gameAppearances"],
    links=song["links"], imgs=song["imgs"], description=song["description"], variations=originalSong.variations, primarySong=originalSong.name, primaryUrl=originalSong.url)


@app.route("/admin-login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        submitted_username = request.form["username"]
        submitted_password = request.form["password"]

        admin = Admin.query.filter_by(adminname=submitted_username).first()

        if admin is not None and check_password_hash(admin.password, submitted_password):
            login_user(admin, remember=False)
            responese = {"status": "success", "url": url_for("admin")}
            return jsonify(responese)
        else: 
            responese = {"status": "error", "message": "Authentication Failed. Make sure the credentials are correct"}
            return jsonify(responese)
    return render_template("admin-login.html")

@app.route("/admin", methods=['GET', 'POST'])
@login_required
def admin():
    data = Objects.query.all()
    data.sort(key=lambda x:str(x.url).replace('-', '').lower())
    if request.method == 'GET':
        request_type = request.args.get('request_type')
        if request_type == "getCurrentUrls":
            all_current_urls = []
            parent_urls = Objects.query.with_entities(Objects.url)
            for parent_url in parent_urls:
                parent_url = parent_url[0]
                all_current_urls.append(parent_url)
            return all_current_urls
    if request.method == 'POST':
        vars = {"touhouOrigin": ["touhouSong", "touhouGame"],
                "originalSong": ["originalSongName", "originalSongArtists", "originalSongLink"],
                "albums": ["albumName", "albumPublisher", "albumReleaseDate", "albumReleaseEvent", "albumType"],
                "gameAppearances": ["gameName", "gamePublisher", "gameReleaseDate"],
                "links": ["linkSource", "displayName", "link", "unofficial"],
                "imgs": ["filename", "caption"]}
        submitted_data = request.get_json()

        raw_variation_data = submitted_data["variations"]
        submitted_data.pop("variations")
        raw_main_data = submitted_data

        def format_data(input_data):
            formatted_data = {}
            for datapoint in input_data:
                if isinstance(input_data[datapoint], str):
                    datapoint_data = None
                    if input_data[datapoint] in ['', 'None']:
                        pass
                    elif datapoint in ["altNames", "artists"]:
                        datapoint_data = input_data[datapoint].split(', ')
                    else:
                        datapoint_data = input_data[datapoint]
                    formatted_data[f"{datapoint}"] = datapoint_data
                elif isinstance(input_data[datapoint], list):
                    datapoint_data = []
                    for sublist in input_data[datapoint]:
                        sublist_dict = {}
                        replaced_sublist = []
                        for value in sublist:
                            if value in ['', 'None']:
                                value = None
                            replaced_sublist.append(value)
                        if replaced_sublist.count(None) != len(list(filter(lambda i:not(type(i) is bool), replaced_sublist))):
                            for rvalue in replaced_sublist:
                                sublist_index = replaced_sublist.index(rvalue)
                                if datapoint == "originalSong" and sublist_index == 1:
                                    rvalue = rvalue.split(', ')
                                sublist_dict[vars[datapoint][sublist_index]] = rvalue
                            if datapoint == "originalSong":
                                datapoint_data = sublist_dict
                            else:
                                datapoint_data.append(sublist_dict)
                    if datapoint_data == []:
                        datapoint_data = None
                    formatted_data[f"{datapoint}"] = datapoint_data
            return formatted_data
        
        formatted_main_data = format_data(raw_main_data)
        formatted_variation_data = []
        for variation in raw_variation_data:
            formatted_variation_data.append(format_data(variation))
        formatted_main_data["variations"] = formatted_variation_data if formatted_variation_data != [] else None

        baseObject = Objects.query.filter_by(url=formatted_main_data["url"]).first()
        for key, value in formatted_main_data.items():
            setattr(baseObject, key, value)
        db.session.commit()
        return json.dumps(f"Successfully updated the data for {formatted_main_data['name']}")
    return render_template("admin.html", data=data)

@app.route("/render_macro", methods=["POST"])
@login_required
def render_macro():
  varName = request.form["varName"]
  varUrl = request.form["varUrl"]

  result = render_template("data-block.html", macro_name="data_block", name=varName, url=varUrl)
  return result

@app.route("/img_upload", methods=["POST"])
@login_required
def upload_image():
    if request.method == "POST":
        file = request.files['file']
        filename = file.filename
        new_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        if os.path.exists(new_path):
            return f"{filename} already uploaded"
        else:
            file.save(new_path)
            return f"Uploaded {filename}"
        
@app.route("/edit_rows", methods=["POST"])
@login_required
def edit_rows():
    if request.method == "POST":
        mode = request.form['function']
        ObjectName = request.form['ObjectName']
        ObjectUrl = request.form['ObjectUrl']
        exists = Objects.query.filter_by(url=ObjectUrl).scalar() is not None
        if mode == 'add' and exists is False:
            newObject = Objects(name=ObjectName, url=ObjectUrl)
            db.session.add(newObject)
            db.session.commit()
            return "Success"
        elif mode == 'remove' and exists is True:
            Objects.query.filter_by(url=ObjectUrl).delete()
            db.session.commit()
            return "Success"
        else:
            return "ERROR: Failed to update database. This means there is a discrepencry between the database and the data sent to the page."

@app.route("/admin-images", methods=["GET", "POST"])
@login_required
def admin_images():
    images = os.listdir(UPLOAD_FOLDER)
    return render_template("admin-images.html", images=images)

@app.route("/export-json", methods=["GET"])
@login_required
def export_json():
    data_table = Objects.query.all()
    export_data = []
    for obj in data_table:
        obj_dict = {"name": obj.name, "url": obj.url, "altNames": obj.altNames, "artists": obj.artists, "songType": obj.songType, "touhouOrigin": obj.touhouOrigin,
                    "originalSong": obj.originalSong, "duration": obj.duration, "albums": obj.albums, "gameAppearances": obj.gameAppearances, "links": obj.links,
                    "imgs": obj.imgs, "description": obj.description, "variations": obj.variations}
        export_data.append(obj_dict)
    current_datetime = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    return {"dbdata": json.dumps(export_data), "time": current_datetime}

if __name__ == '__main__':
    app.run(debug=True)