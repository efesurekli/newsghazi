// TODO:
// 0. Get the radial lines drawn
// 1. Reorder the emotions on the pentagon so they make intuitive sense
// 2. Add animations for when the psychogram first draws
// 3. Figure out whether blending the colors makes any sense


var initJSON = { 
  anger: '0.00',
  disgust: '0.00',
  fear: '0.00',
  joy: '0.00',
  sadness: '0.00' };

var updateJSON = { 
  anger: '0.90',
  disgust: '0.84',
  fear: '0.23',
  joy: '0.83',
  sadness: '0.35' 
};

const EMOTION_COLORS = {
  anger: '#E80521',
  disgust: '#592684',
  fear: '#325E2B',
  joy: '#FFD629',
  sadness: '#086DB2'
};

renderRadialGraph(initJSON);
getBlendedColor(updateJSON);

// This does a bit of bespoke magic and blends the colors together
// naively but semi-acceptably
function getBlendedColor(docEmotions) {
  var emotionKeys = Object.keys(docEmotions);
  var emotionCount = docEmotions.length;

  var weights = emotionKeys.map(key => parseFloat(docEmotions[key]));
  var sortedTuples = weights
              .map((weight, i) => [emotionKeys[i], weight])
              .sort((a,b) => b[1] - a[1]);
  var slopedTuples = sortedTuples.map((tuple,i) => {
    tuple[1] = Math.max(tuple[1]*(-0.40*i+1.2),0);
    return tuple;
  });

  docEmotions = slopedTuples.reduce((obj, tuple) => {
    obj[tuple[0]] = tuple[1];
    return obj;
  },{});

  var emotionSum = emotionKeys.reduce((sum, emotion) => { 
    return sum += parseFloat(docEmotions[emotion]); 
  },0);

  emotionSum = Math.round(emotionSum*100)/100;
  var normWeights = emotionKeys.map(emotion => (emotionSum) ? Math.round(docEmotions[emotion]/emotionSum*100)/100 : 0);

  var blendedColor = emotionKeys.reduce((blendRGB, emotion, i) => {
    var weight = normWeights[i];
    var emotionRGB = d3.rgb(EMOTION_COLORS[emotion]);
    blendRGB.r += weight * emotionRGB.r
    blendRGB.g += weight * emotionRGB.g
    blendRGB.b += weight * emotionRGB.b
    return blendRGB;
  },d3.rgb(0,0,0));
  blendedColor.r = Math.round(blendedColor.r);
  blendedColor.g = Math.round(blendedColor.g);
  blendedColor.b = Math.round(blendedColor.b);
  return blendedColor;
}

function updateRadialGraph(docEmotions) {
  // Calculates top two colors and blends them by weight
  var keys = Object.keys(docEmotions);
  var weights = keys.map(key => parseFloat(docEmotions[key]));
  var perimeterPath = d3.select('.radial-values');
  var lineData = getPolyPoints(5,60,weights).perimeter;
  var lineFunction = d3.svg.line()
       .x(d => d.x)
       .y(d => d.y)
       .interpolate("linear");

  perimeterPath.transition()
    .attr("d", lineFunction(lineData))
    .attr('fill', getBlendedColor(docEmotions));
;
}

setTimeout(() => updateRadialGraph(updateJSON), 0);

function renderRadialGraph(docEmotions) {
  var weights = Object.keys(docEmotions).map(key => parseFloat(docEmotions[key]));
  // console.log(weights);
  var emotions = Object.keys(docEmotions);
  var n = 5
  var polyData = getPolyPoints(5,60);
  var lineData = polyData.perimeter;
  lineData.forEach(function(point,i) {
    point.text = emotions[i];
  });
  // console.log(JSON.stringify(lineData));

  var svgContainer = d3.select('#pentagon').append('svg');

  var lineFunction = d3.svg.line()
       .x(function(d) { return d.x; })
       .y(function(d) { return d.y; })
       .interpolate("linear");

  svgContainer.append("path")
    .attr('class','radial-perimeter')
    .attr("d", lineFunction(lineData))
    .attr("stroke", "grey")
    .attr("fill","lightgrey");


  var weightedLineData = getPolyPoints(5,60,weights).perimeter;
  var svgContainer = d3.select('svg')
  svgContainer.append("path")
    .attr('class', 'radial-values')
    .attr("d", lineFunction(weightedLineData))
    .attr("stroke", "grey")
    .attr("fill","red");

  // BEGIN graph thing for whatsitsface

  var scores = dummySentences.map(sentence => 
    sentence.sentiment.score*sentence.sentiment.magnitude*50);

  var sentimentFunction = d3.svg.line()
    .x((d, i) => i*1.5)
    .y((d, i) => d+80)
    .interpolate('linear');

  var secondSvg = d3.select('#pentagon').append('svg')

  secondSvg.append('path')
    .attr('d', sentimentFunction(scores))
    .attr('stroke', 'black')
    .attr('fill', 'none');


  // END graph thing

  svgContainer.selectAll('.emotion-label')
    .data(lineData)
    .enter()
    .append('text')
    .attr('text-anchor', 'middle')
    .text(d => d.text)
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('class','.emotion-label');

  d3.selectAll('.emotion-label')
    .each(d => {
      console.log(this);
    });

  var radialData = polyData.radials;
  svgContainer.selectAll('.emotion-radials')
    .data(radialData)
    .enter()
    .append('line')
    .attr('x1', d => d.x1)
    .attr('y1', d => d.y1)
    .attr('x2', d => d.x2)
    .attr('y2', d => d.y2)
    .attr('class', '.emotion-radials')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('opacity', 0.2);
}

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function getPolyPoints(n, radius, weights) {
  var center = { x: radius*1.4, y: radius*1.2 };
  var angle = 0;
  var delta = 360/n;
  var perimeter = [];
  var radials = [];
  var radians, x , y;
  var index;
  while (angle <= 360) {
    index = angle/delta % n;
    // console.log(index);
    radians = toRadians(angle+180);
    x = center.x + (weights ? weights[index]:1)*radius*Math.sin(radians);
    y = center.y + (weights ? weights[index]:1)*radius*Math.cos(radians);
    var point = {
      x: Math.round(x*100)/100,
      y: Math.round(y*100)/100
    };
    var radial = {
      x1: center.x,
      y1: center.y,
      x2: point.x,
      y2: point.y
    };
    radials.push(radial)
    perimeter.push(point);
    angle += delta;
  }
  return { perimeter, radials };
};
