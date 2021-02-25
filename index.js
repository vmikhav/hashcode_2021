'use strict';

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sortDesc = (a, b) => b-a;

const ProgressBar = require('progress');

const fs = require('fs');

let fileNames = ['./a.txt', './b.txt', './c.txt', './d.txt', './e.txt', 'f.txt'];
let resultNames = ['./a_out.txt', './b_out.txt', './c_out.txt', './d_out.txt', './e_out.txt', 'f_out.txt'];

let taskCode = process.argv[2];

let data = fs.readFileSync(fileNames[taskCode]).toString().split("\n");
let resultText = '';
let generalData = data[0].split(' ').map(parseFloat);
const duration = generalData[0], intersectionsCount = generalData[1], streetsCount = generalData[2], carsCount = generalData[3], bonus = generalData[2];
let streets = [];
let streetNames = {};
let cars = [];
let traffic = [];
let queues = [];
let intersections = [];

for (let i = 0; i < intersectionsCount; i++) {
  intersections.push({in: [], out: []});
}

for (let i = 1, j = 0; j < streetsCount; i++, j++) {
  let row = data[i].split(' ');
  let s = parseInt(row[0]);
  let e = parseInt(row[1]);
  streets.push({
    s,
    e,
    l: parseInt(row[3]),
    load: 0,
    sload: 0,
    name: row[2],
  });
  streetNames[row[2]] = j;
  queues.push([]);
  intersections[s].out.push(j);
  intersections[e].in.push(j);
}

for (let i = streetsCount + 1, j = 0; j < carsCount; i++, j++) {
  let row = data[i].split(' ');
  row.shift();
  cars.push({l: row.length, streets: row.map(name => streetNames[name])});
  traffic.push({street: cars[j].streets[0], street_index: 0, delay: 0});
  queues[cars[j].streets[0]].push(j);
  streets[cars[j].streets[0]].sload++;
  // cars[j].good = cars[j].streets.reduce((a, c) => a + streets[c].l + 1, 0) < duration;
}
data = null;
let bar;

console.log('Simulate traffic');
let sDuration = duration * 4;
bar = new ProgressBar(':bar :percent :etas', { total: sDuration - 1 });
let t, s, c, i;
for (t = 0; t < sDuration; t++) {
  bar.tick(1);
  for (c = 0; c < carsCount; c++) {
    if (traffic[c].delay > 0) {
      traffic[c].delay -= 1;
    }
  }
  for (i = 0; i < intersectionsCount; i++) {
    s = intersections[i].out[Math.floor(Math.random() * intersections[i].out.length)];
    if (queues[s].length) {
      if (queues[s].length > streets[s].load) {
        streets[s].load = queues[s].length;
      }
      c = queues[s][0];
      if (traffic[c].delay === 0 ) {
        queues[s].shift();
        traffic[c].street_index++;
        if (traffic[c].street_index >= cars[c].l) {
          traffic[c].delay = -1;
        } else {
          s = cars[c].streets[traffic[c].street_index];
          traffic[c].street = s;
          traffic[c].delay = streets[s].l;
          queues[s].push(c);
        }
      }
    }
  }
}
bar.terminate();

let result = [];

let total;
let localRes;
let maxLoad, maxSLoad;
let q;
const Q = 30;
for (i = 0; i < intersectionsCount; i++) {
  localRes = [];
  total = 0;
  maxLoad = 0;
  maxSLoad = 0;

  if (intersections[i].in.length) {
    intersections[i].in.sort((a, b) => b.sload-a.sload);
    maxSLoad = streets[intersections[i].in[0]].sload;
    for (s = 0; s < intersections[i].in.length; s++) {
      c = streets[intersections[i].in[s]].load;
      total += c;
      if (c > maxLoad) {
        maxLoad = c;
      }
    }
    q = Math.min(7 * intersections[i].in.length, Math.max(maxSLoad, maxLoad) * total / 3) / total;
    for (s = 0; s < intersections[i].in.length; s++) {
      //c = Math.ceil(streets[intersections[i].in[s]].load * q * (Math.random() / .3 + .15));
      c = Math.ceil((Math.random() * 5));
      if (c > 0) {
        localRes.push({s: intersections[i].in[s], c});
      }
    }

    if (localRes.length) {
      result.push({i, localRes});
    }
  }
}

let res = '' + result.length;
for (i = 0; i < result.length; i++) {
  res += '\n';
  res += result[i].i + "\n" + result[i].localRes.length + "\n";
  res += result[i].localRes.map(item => streets[item.s].name + ' ' + item.c).join("\n");
}


fs.writeFile(resultNames[taskCode], res, function(err) {
  if(err) {
    return console.log(err);
  }

  console.log("\nThe file was saved!");
});

