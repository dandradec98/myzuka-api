const cheerio = require("cheerio");
const express = require("express");
const rp = require("request-promise");
const utf8 = require("utf8");
const getJSON = require("get-json");
const cors = require("cors");

const port = process.env.PORT || 8080;

/*Starting server*/
const app = express();

app.listen(port);

/*API and Webpage data*/
const myzuka = "https://myzuka.club";

const api = 'https://api-myzuka.herokuapp.com';

app.get("/", (req, res, html) => {
    res.send("WELCOME TO MYZUKA API");
});

app.get("/Song/:id/:name", (req, res) => {
    const id = req.params.id;
    const name = utf8.encode(req.params.name);

    const options = {
        url: utf8.encode(`${myzuka}/Song/${id}/${name}`),
        headers: {
            "User-Agent": "request-promise"
        },
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    rp(options)
        .then(function ($) {
            const info = $("div.main-details");

            /*Picture song*/
            const picUrl = info.find("img").attr("src");

            const dataSong = info.find("tr").first();

            /*Genres song*/
            const genre = [];

            dataSong
                .next()
                .find("meta")
                .attr("content", (i, value) => {
                    genre.push(value);
                });

            /*Artist song*/
            const artist = [];

            dataSong
                .next()
                .next()
                .find(`meta[itemprop = 'name']`)
                .attr("content", (i, value) => {
                    artist.push(value);
                });

            /*Album song*/

            const album = dataSong
                .next()
                .next()
                .next()
                .find(`meta[itemprop = 'name']`)
                .attr("content");

            /*Url download song*/

            const name = $('div.player-inline')
                .find('p.big-song')
                .find('span')
                .text();

            const songUrl = myzuka + $(`a[itemprop = 'audio']`).attr("href");
            const playUrl = songUrl.replace('Download', 'Play');

            const jsonObj = {
                album: album,
                artist: artist,
                genre: genre,
                name: name,
                picUrl: picUrl,
                playUrl: playUrl,
                songUrl: songUrl
            };

            res.json(jsonObj);
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.get("/Album/:id/:name", (req, res) => {
    const id = req.params.id;
    const name = utf8.encode(req.params.name);

    const options = {
        url: utf8.encode(`${myzuka}/Album/${id}/${name}`),
        headers: {
            "User-Agent": "request-promise"
        },
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    rp(options)
        .then(function ($) {
            const originSongUrl = [];

            const tmpUrl = $(`span[itemprop = 'byArtist']`)
                .next()
                .find("a")
                .attr("href", (i, value) => {
                    originSongUrl.push(api + value);
                });

            const songs = [];

            originSongUrl.forEach(e => {
                getJSON(e)
                    .then(function (response) {
                        songs.push(response);

                        if (songs.length === originSongUrl.length)
                            res.json(songs);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            });
        })
});

app.get("/Artist/:id/:name", (req, res) => {
    const id = req.params.id;
    const name = utf8.encode(req.params.name);

    const options = {
        url: utf8.encode(`${myzuka}/Artist/${id}/${name}`),
        headers: {
            "User-Agent": "request-promise"
        },
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    rp(options)
        .then(function ($) {
            const originSongUrl = [];
            const hotSongs = [];

            const tmpUrl = $('div#result')
                .find('div.details')
                .find('p')
                .find('a')
                .attr('href', (i, value) => {
                    originSongUrl.push(api + value);
                })

            originSongUrl.forEach(e => {
                getJSON(e)
                    .then(function (response) {
                        hotSongs.push(response);

                        if (hotSongs.length === originSongUrl.length)
                            res.json(hotSongs);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            });
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.get("/Artist/:id/:name/Albums", (req, res) => {
    const id = req.params.id;
    const name = utf8.encode(req.params.name);

    const options = {
        url: utf8.encode(`${myzuka}/Artist/${id}/${name}/Albums`),
        headers: {
            "User-Agent": "request-promise"
        },
        transform: function (body) {
            return cheerio.load(body);
        }
    };


    rp(options)
        .then(function ($) {
            const albums = [];
            const originAlbumUrl = [];
            const apiAlbumUrl = [];
            const picAlbumUrl = [];

            $('div#result')
                .find('div.vis')
                .find('img')
                .attr('src', (i, value) => {
                    picAlbumUrl.push(value);
                });

            const albumInfo = $('div#result')
                .find('div.info')
                .find('div.title')
                .find('a');

            const albumTitle = [];

            albumInfo
                .contents()
                .toArray()
                .forEach((e) => {
                    albumTitle.push(e.data);
                })

            albumInfo.attr('href', (i, value) => {
                originAlbumUrl.push(myzuka + value);
                apiAlbumUrl.push(api + value);

                const jsonObj = {
                    name: albumTitle[i],
                    apiAlbumUrl: apiAlbumUrl[i],
                    originAlbumUrl: originAlbumUrl[i],
                    picAlbumUrl: picAlbumUrl[i]
                };

                albums.push(jsonObj);
            })

            res.json(albums);
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.use(cors( {credentials: true, origin: true} ));

console.log(`Myzuka API running on port ${port}`);

module.exports = app;
