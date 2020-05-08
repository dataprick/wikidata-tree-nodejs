const wbk = require('wikidata-sdk');
const fetch = require('node-fetch');
const async = require('async');
var wikidataController = require('../controllers/wikidata');
var treeType = 'ancestors';
var relations = [
    { prop : 'P22' , name : 'father' , to_q : false , edge_color : '#3923D6' } ,
    { prop : 'P25' , name : 'mother' , to_q : false , edge_color : '#FF4848' } ,
    // { prop : 'P40' , name : 'child' , to_q : false , edge_color : '#888888' }
] ;

var supportedTypes  = {
    'ancestors': relations,
    'descendants' : [{ prop : 'P40' , name : 'child' , to_q : false , edge_color : '#888888' }],
    'owner'    : [
        { prop : 'P127' , name : 'owner' ,      to_q : false , edge_color : '#3923D6' } ,
        { prop : 'P749' , name : 'parentOrg' ,  to_q : false , edge_color : '#FF4848' } ,
    ],
    'owns'    : [
        { prop : 'P1830' , name : 'owns' ,      to_q : false , edge_color : '#3923D6' } ,
        { prop : 'P355' , name : 'subsidiary' ,  to_q : false , edge_color : '#FF4848' } ,
    ],
    'subclasses'    : [
        // { prop : 'P1830' , name : 'owns' ,      to_q : false , edge_color : '#3923D6' } ,
        { prop : 'P279' , name : 'subclass' ,  to_q : false , edge_color : '#FF4848' } ,
    ]
};
exports.init = function(root) {
    var maxLevel =3;
    var rows = [];
    var lang ="en";
    getLevel(
        root,
        '',
        lang,
        maxLevel,
        function() {
            // console.log("DONE");
            // console.log(rows);
            const replaceLabels = (string, values) => string.replace(/{(.*?)}/g,
                (match, offset) => (values && values[offset].labels && values[offset].labels[lang]) ?
                    values[offset].labels[lang].value :
                    values[offset].id
            );
            labels = data.entities;
            // console.log(labels);
            for(row in rows){
                // console.log(rows[row].innerHTML);
                rows[row].innerHTML =replaceLabels(rows[row].innerHTML,labels);
            }
            return rows;
        },
        rows
    );
};

var imageURLS = [];

function getLevel(item_id, child_id, lang, level, callback, rows) {
    console.log("getLevel", level);
    if (level === 0) {
        callback();
        return;
    }
    wikidataController.wikidataApi({
        ids :  [item_id ],
        // props : 'labels|descriptions|claims|sitelinks/urls' ,
        lang : lang //+ (secondLang ? "|"+secondLang : ""),
    },function (data) {
        console.log(data);
        processLevel(data, item_id, child_id, lang, level, callback, rows);
    });
}

var nodeImages = [];
function processLevel(data, item_id, child_id, lang, level, levelCb, rows) {

    // data.entities = data;
    var label = (data.entities[item_id].labels[lang] ? data.entities[item_id].labels[lang].value : "undefined");
    if(label === "undefined"){
        label = (data.entities[item_id].labels.en ? data.entities[item_id].labels.en.value : "undefined");
    }
    // if(secondLang){
    //     var label2 = (data.entities[item_id].labels[secondLang] ? data.entities[item_id].labels[secondLang].value : null);
    // }
    // for (label_lang in data.entities[item_id].labels) {
    //     var label =  data.entities[item_id].labels[label_lang].value;
    //     break;
    // }
    // for(descr_lang in data.entities[item_id].descriptions) {
    //     var descr =  data.entities[item_id].descriptions[descr_lang].value;
    //     break;
    // }
    var claims = data.entities[item_id].claims;

    // console.log(treeType);
    if(treeType === "ancestors") {
        // mother P25
        var mother_item_id = claims['P25'][0] || null;
        // father P22
        var father_item_id = claims['P22'][0] || null;
        // image P18
    }
    var images = [];
    console.log(claims['P18']);return;
    if(claims['P18']){//image
        for(claim in claims['P18']) {
            images.push({
                'url': 'https://commons.wikimedia.org/wiki/Special:FilePath/' + claims['P18'][claim] + '?width=100px',
            });
        }
    }
    if(claims['P154']){//logo propery
        images.push({
            'url': 'https://commons.wikimedia.org/wiki/Special:FilePath/'+  claims['154'][0] +'?width=100px',
        });
    }
    // if(!image_page){
    //     image_page = getValue(claims['P6500']);
    // }

    var itemIdNumber = item_id.substr(1);
    if(claims['P2002']){
        images.push({
            'url': 'https://avatars.io/twitter/'+claims['P2002'][0],    //https://avatars.io/twitter/jesslynewidjaja
            'source': "Twitter",
        });
    }
    if(imageURLS[itemIdNumber]) {
        images.push({'url': imageURLS[itemIdNumber] });
    }

    // gender P21
    var className = "";

    var sortValue = null;

    if (claims['P21']) {
        var gender_id = parseInt((claims['P21'][0]).substr(1));
        var gender_html = '';
        if (gender_id === 6581097) {
            sortValue=0;
            gender_html = '<i class="fa fa-mars"></i>';
            className = 'node-male'
        } else if (gender_id === 6581072) {
            sortValue=1;
            gender_html = '<i class="fa fa-venus"></i>';
            className = 'node-female'
        } else{
            className = 'node-thirdgender';
        }
    }




    var asyncFunctions = [
        function(callback) {
            var html = '<p class="node-name">';
            html += '<a target="_blank" href="https://www.wikidata.org/wiki/' + item_id + '">' + label + '</a>';
            if(label2 && label != label2){//add second language icon
                html += '<br />'+label2;
            }
            //'<a href="' + location.href.replace(location.search, '') + '?q=' + item_id + '">' + label + '</a>';
            html += '</p><p class="node-title">' ;
            var peopleData = getPeopleData(claims);
            html += peopleData.html;
            if(chartOptions.socialmedia && data.entities[item_id].sitelinks && data.entities[item_id].sitelinks[lang+"wiki"])
                html += '<a title="Read on Wikipedia" target="_blank" href="'+ data.entities[item_id].sitelinks[lang+"wiki"].url +'" style="margin-right: 5px"><img src="storage/icons/wikipedia.png" style="height: 16px;"/></a>';


            if(treeType === "descendants"){
                sortValue = peopleData.sortValue;
            }
            html += '</p>';
            // if(treeType === "owner") {
            //     // html += '<p>Proportion</p>';
            //     var industry = getValueQid(claims['P452']);
            //     if(industry) {
            //         labelIds.push(industry);
            //         html += '<p>Industry: {' + industry + '}</p>';
            //     }
            // }
            if(images.length > 0){
                nodeImages[item_id] = [0,images];
                html = '<img class="node_image" id="image_'+ item_id +'" data-item="'+ item_id +'" alt="" src="'+  images[0].url +'">'  + html;
            }
            var newRow = {
                id: item_id,
                innerHTML: html,
                parent_id: child_id,
                stackChildren: stackChildren,
                HTMLclass : className,
                sortValue: sortValue,
            };

            //fetch GENI pic if present TODO
            // if (!image_page && getValue(claims['P2600'])) {
            //     $.getJSON(
            //         // "https://www.geni.com/api/profile-g" + getValue(claims['P2600']) +"/photos",
            //         "/treeapi",
            //         {
            //             source : "geniPhotos",
            //             profile: getValue(claims['P2600']),
            //         },
            //         function (data) {
            //             console.log(data);
            //             newRow.innerHTML = '<img alt="File:" src="">'  + html;
            //             rows.push(newRow);
            //             callback(null, rows);
            //         }
            //     );
            // }
            // // fetch wikitree pic if present
            // else
            if (false && !image_page && getValue(claims['P2949'])) {
                $.getJSON(
                    // "https://api.wikitree.com/api.php?callback=?",
                    "/treeapi",
                    {
                        source : "wikitree",
                        action: "getProfile",
                        key : getValue(claims['P2949'])
                    },
                    function (data) {
                        console.log("Fetched from Wikitree");
                        if(data[0] && data[0].profile.PhotoData && data[0].profile.PhotoData.url){
                            newRow.innerHTML = '<img title="FileSource:Wikitree.com" src="https://www.wikitree.com'+ data[0].profile.PhotoData.url +'">'  + html;
                        }
                        rows.push(newRow);
                        callback(null, rows);
                    }
                );
            } else {
                rows.push(newRow);
                callback(null, rows);
            }
        }
    ];
    var duplicates = rows.some(o => o.id === item_id);
    // console.log(duplicates);
    if(!duplicates) {
        // if( && treeType != "ancestors")
        var r = supportedTypes[treeType];
        if(!r){
            var children = claims[treeType] || [];
        }else {
            // console.log(r);
            var children = claims[r[0].prop] || [];
            if (r[1]) {
                children = children.concat(claims[r[1].prop]);
            }
        }
        // var owners = (claims['P127'] || []).concat(claims['P749']);
        // console.log("list");
        var children_distinct_Qids = [];
        for(var child in children) {
            if (!hasEndQualifier(children[child])) {
                var child_item_id = getValueQidOfClaim(children[child]);
                if(children_distinct_Qids.indexOf(child_item_id) == -1){
                    children_distinct_Qids.push(child_item_id);
                }
            }
        }
        // console.log(children_distinct_Qids);
        for(child in children_distinct_Qids){
            // console.log(owner_distinct_ids[owner]);
            asyncFunctions.push(function (child_item_id, callback) {
                // console.log(child_item_id);
                if (child_item_id) {
                    getLevel(
                        child_item_id,
                        item_id,
                        lang,
                        level - 1,
                        callback,
                        rows
                    );
                } else {
                    callback();
                }
            }.bind(null, children_distinct_Qids[child]));
        }
    }



    async.parallel(asyncFunctions,
        function(err, results) {
            // console.log("level", level);
            // updateRows(rows);
            levelCb();
        }
    );
}



function getValue(claim) {
    console.log(claim);
    return (claim && claim[0].mainsnak.datavalue && claim[0].mainsnak.datavalue.value) || null;
}

function getValueData(claim, dataType) {
    var value = getValue(claim);
    return value ? value[dataType] : null;
}

function getValueQid(claim) {
    var numericId = getValueData(claim, 'numeric-id');
    return numericId ? 'Q' + numericId : null;
}
function getValueQidAndAddLabel(claim) {
    value = getValueQid(claim);
    if(value ) {//&& labelIds.indexOf(value) == -1
        labelIds.push(value);
    }
    return value;
}
function getYearOfQualifier(q) {
    return q.datavalue.value.time.substr(1,4);
}
function getValueQidOfClaim(claim) {
    var value = (claim && claim.mainsnak.datavalue && claim.mainsnak.datavalue.value) || null;
    var numericId = value ? value['numeric-id'] : null;
    return numericId ? 'Q' + numericId : null;
}

function getQualifiers(claim,q) {
    var qualifiers = (claim && claim.qualifiers) || null;
    if(q){
        if(!qualifiers){
            return [];
        }
        return (qualifiers[q]) || [];
    }
    return qualifiers;
}
function hasEndQualifier(claim) {
    return getQualifiers(claim,"P582").length > 0;
}