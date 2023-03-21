var GLOBAL = {
  pointIdx: 0, //POINT 인덱스
  lineIdx: 0, //LINE 인덱스
  polygonIdx: 0, //POLYGON 인덱스
  Analysis: null, //지도 분석기능 API객체
  ghostSymbolmap: null, //GHOSTSYBOLMAP API객체
  ghostSymbolLayer: null, //GHOSTSYBOL LAYER 객체
  MOVE_PATH: null, //애니메이션
  CURRENT_MOVEMENT: null,
  MOUSE_BUTTON_PRESS: false,
  TRACE_TARGET: null,
  RCidx: 0,
  events: {
    // 이벤트 핸들러 존재 유무
    selectobject: false,
    selectbuilding: false,
    selectghostsymbol: false,
  },
};
var Module;

function initUIEvent() {
  /**검색 입력칸 엔터이벤트 */
  $("#searchKeyword").on("keypress", function (e) {
    if (e.keyCode == 13) {
      $(".search button").click();
      $("#searchKeyword").blur();
    }
  });

  //위치 검색 페이지 이동	(동적요소에 .click()이 적용 안되는 오류가 있음)
  $(document).on("click", ".s_paging li", function (e) {
    let num = this.innerText;

    if ($(this).attr("disabled") == "disabled") {
      return;
    }

    if (num == "▶") {
      num = Number($("#currnetPage").text()) + 1;
    } else if (num == "◀") {
      num = Number($("#currnetPage").text()) - 1;
    }

    searchPlace(num);
  });

  //위치 검색 결과 클릭 시 좌표 이동
  $(document).on("click", ".s_location li", function (e) {
    let camera = Module.getViewCamera();
    camera.setLocation(
      new Module.JSVector3D(
        Number(this.dataset.pointx),
        Number(this.dataset.pointy),
        1000
      )
    );
  });

  //윈도우 크기 자동 적용
  window.onresize = function () {
    if (typeof Module == "object") {
      Module.Resize(window.innerWidth - 405, window.innerHeight);
      Module.XDRenderData();
    }
  };

  //메뉴 클릭시 지도 표시 내용 초기화
  $("#right_tab_btn li").click(function (e) {
    var layerList = new Module.JSLayerList(true);

    if (this.innerText != "검색") {
      $("#tab2 h2").html("");
      $(".s_paging").html("");
      $(".s_location").html("");
      $("#searchKeyword").val("");
      layerList.delLayerAtName("Search_POI");
      $(".firstmenu").click();
    }
    if (this.innerText != "인터렉션") {
      layerList.setVisible("POI_Layer", false);
      layerList.setVisible("LINE_Layer", false);
      layerList.setVisible("POLYGON_Layer", false);
    } else {
      layerList.setVisible("POI_Layer", true);
      layerList.setVisible("LINE_Layer", true);
      layerList.setVisible("POLYGON_Layer", true);
    }

    if (this.innerText != "모델객체관리") {
      Module.XDEMapRemoveLayer("facility_build");
      $(".vworldBuilding input[type=checkbox]").attr("checked", false);
      $("#removeAll3Dbtn").click();
      $(".firstmenu").click();
    }
    if (this.innerText != "레이어추가") {
      let servicelayerList = new Module.JSLayerList(false);
      servicelayerList.delLayerAtName("wmslayer_lt_c_ademd");
      servicelayerList.delLayerAtName("wmslayer_lt_c_upisuq161");
      servicelayerList.delLayerAtName("wmslayer_lt_c_wkmbbsn");

      layerList.delLayerAtName("lt_c_ud801_Layer");
      layerList.delLayerAtName("lt_p_moctnode_Layer");
      $("#d_mapadmin input[type=checkbox]").attr("checked", false);
    }
    if (this.innerText != "현실정보") {
      Module.map.stopWeather(); //기상효과 종료
      Module.map.clearSnowfallArea(); //적설효과 초기화
      Module.map.setSnowfall(0); //적설효과 해제
      Module.map.setFogEnable(false); //안개효과 적용
      $(".firstmenu").click();
      $("#removeDatabtn").click();
      $("#tab5 input[type=checkbox]").attr("checked", false);
    }
    if (this.innerText != "분석") {
      Module.XDEMapRemoveLayer("facility_build");
      Module.XDSetMouseState(1);
      Module.map.clearInputPoint();
      Module.getSlope().clearAnalysisData();
      Module.map.clearSelectObj();
      Module.getUserLayer().removeAll();

      GLOBAL.Analysis.setVFMode(false); // 가시권 3D 표현 여부 설정
      GLOBAL.Analysis.setVFCreateClickMode(false);

      $("#tab7 input[type=checkbox]").attr("checked", false);
      $("#tab8 input[type=checkbox]").attr("checked", false);
    }
  });

  $(".tabs_4")
    .children("li")
    .eq(1)
    .click(function (e) {
      Module.XDSetMouseState(1);
      Module.map.clearInputPoint();
    });
}

// ##실습 1. 기본지도 호출 함수
function callXDWorldMap() {
  /*********************************************************
   * 엔진 파일을 로드합니다.
   * 파일은 asm.js파일, html.mem파일, js 파일 순으로 적용합니다.
   *********************************************************/
  var tm = new Date().getTime(); // 캐싱 방지

  // 1. XDWorldEM.asm.js 파일 로드
  var file = "/js/xdmap/XDWorldEM.asm.js?tm=" + tm;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", file, true);
  xhr.onload = function () {
    var script = document.createElement("script");
    script.innerHTML = xhr.responseText;
    document.body.appendChild(script);

    // 2. XDWorldEM.html.mem 파일 로드
    setTimeout(function () {
      (function () {
        var memoryInitializer = "/js/xdmap/XDWorldEM.html.mem?tm=" + tm;
        var xhr = (Module["memoryInitializerRequest"] = new XMLHttpRequest());
        xhr.open("GET", memoryInitializer, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function () {
          // 3. XDWorldEM.js 파일 로드
          var url = "/js/xdmap/XDWorldEM.js?tm=" + tm;
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.onload = function () {
            var script = document.createElement("script");
            script.innerHTML = xhr.responseText;
            document.body.appendChild(script);
          };
          xhr.send(null);
        };
        xhr.send(null);
      })();
    }, 1);
  };
  xhr.send(null);

  /*********************************************************
   *	엔진파일 로드 후 Module 객체가 생성되며,
   *  Module 객체를 통해 API 클래스에 접근 할 수 있습니다.
   *	 - Module.postRun : 엔진파일 로드 후 실행할 함수를 연결합니다.
   *	 - Module.canvas : 지도를 표시할 canvas 엘리먼트를 연결합니다.
   *********************************************************/

  Module = {
    TOTAL_MEMORY: 256 * 1024 * 1024,
    postRun: [initXDMap],
    canvas: (function () {
      // Canvas 엘리먼트 생성
      var canvas = document.createElement("canvas");

      // Canvas id, Width, height 설정
      canvas.id = "canvas";

      canvas.width = window.innerWidth - 405;
      canvas.height = window.innerHeight;

      canvas.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      });

      // 생성한 Canvas 엘리먼트를 xdContainer요소에 추가합니다.
      document.getElementById("xdContainer").appendChild(canvas);

      return canvas;
    })(),
  };
}

/* 엔진 로드 후 실행할 초기화 함수(Module.postRun) */
function initXDMap() {
  Module.Start(window.innerWidth - 405, window.innerHeight);
  Module.map = Module.getMap();
  GLOBAL.Analysis = Module.getAnalysis(); //지도 내 분석기능 설정 API
  GLOBAL.ghostSymbolmap = Module.getGhostSymbolMap(); //고스트심볼맵 API
  Module.SetResourceServerAddr("https://www.dtwincloud.com/assets/resource/");

  setNavigatorVisible($("#navigator").prop("checked")); //네비게이터 유무
  validDragSdis(); //드래그 방지
  initUIEvent(); //검색 클릭 이벤트
}

/**네비게이터 옵션 함수*/
function setNavigatorVisible(val) {
  //지도가 생성되지 않은 경우, 취소
  if (Module == null) {
    return;
  }

  if (val) {
    Module.getNavigation().setNaviVisible(Module.JS_VISIBLE_ON);
  } else {
    Module.getNavigation().setNaviVisible(Module.JS_VISIBLE_OFF);
  }
}

/**지도 외 영역 드래그 방지 함수 */
function validDragSdis() {
  var validDiv = document.getElementById("canvas");

  validDiv.onmouseover = function () {
    Module.XDIsMouseOverDiv(false);
  };

  validDiv.onmouseout = function () {
    Module.XDIsMouseOverDiv(true);
  };
}

//##실습 2. 카메라 이동합수
function moveCamera() {
  var lon = $("#camLon").val(); //경도
  var lat = $("#camLat").val(); //위도
  var alt = $("#camAlt").val(); //높이

  //Number로 형변환
  lon = parseFloat(lon);
  lat = parseFloat(lat);
  alt = parseFloat(alt);

  let camera = Module.getViewCamera();
  camera.setLocation(new Module.JSVector3D(lon, lat, alt));
}

//##실습 3. 클릭지점 좌표 이벤트 함수
function setMouseLClickEvent(flag) {
  if (flag) {
    Module.canvas.onmousedown = function (e) {
      var screenPosition = new Module.JSVector2D(e.x - 405, e.y);

      // 화면->지도 좌표 변환
      var mapPosition = Module.map.ScreenToMapPointEX(screenPosition);
      lon = parseFloat(mapPosition.Longitude).toFixed(6);
      lat = parseFloat(mapPosition.Latitude).toFixed(6);

      $("#evntLon").val(lon); //인풋에 입력
      $("#evntLat").val(lat);
    };
  } else {
    Module.canvas.onmousedown = "return false;";
  }
}

/**
 * ##실습 4. vworld api를 이용한 위치검색 함수
 *  1) 키워드 위치 검색
 *  2) 검색 목록 별 POINT 생성
 *  3) 페이징 적용
 *  4) 검색 목록 클릭시 해당 위치로 이동
 * */

//vworld 위치 검색 api
function searchPlace(pageNum) {
  //검색할 키워드
  var keyword = $("#searchKeyword").val();

  if (keyword.trim().length == 0) {
    $("#tab2 h2").html("");
    $(".s_paging").html("");
    $(".s_location").html("");
    var layerList = new Module.JSLayerList(true);
    layerList.delLayerAtName("Search_POI");
    return;
  }

  var params = {
    service: "search",
    request: "search",
    version: "2.0",
    crs: "EPSG:4326",
    size: 10,
    page: pageNum,
    query: keyword,
    type: "PLACE",
    format: "json",
    errorformat: "json",
    key: "B9ECCC18-DD44-3F46-A14B-EFFF588CF200",
  };

  $.ajax({
    type: "GET",
    url: "http://api.vworld.kr/req/search",
    dataType: "JSONP",
    data: params,
    success: function (data) {
      //검색 결과 목록 배치
      $("#tab2 h2").html("<span>" + keyword + "</span> 검색결과입니다.");
      let result = "";
      for (let i = 0; i < data.response.record.current; i++) {
        result +=
          '<li class="title active" data-pointx=' +
          data.response.result.items[i].point.x +
          " data-pointy=" +
          data.response.result.items[i].point.y +
          "><ul>";
        result += "<li>" + data.response.result.items[i].title + "</li>";
        result +=
          "<li>" + data.response.result.items[i].address.parcel + "</li>";
        result +=
          '<li class="addr">' +
          data.response.result.items[i].address.road +
          "</li>";
        result +=
          '<li class="phone">' +
          data.response.result.items[i].id +
          "<span> | " +
          data.response.result.items[i].category +
          "</span></li></ul></li>";

        $(".s_location").html(result);
        //검색 결과 point 배치
        setSearchPOINT(
          data.response.result.items[i].point.x,
          data.response.result.items[i].point.y,
          i
        );
      }

      //검색 결과 페이징 목록 배치
      let pageData = data.response.page;
      let pagination = "";
      let startPage = parseInt((pageData.current - 1) / 10) * 10 + 1; //시작페이지
      let endPage = startPage + (pageData.size - 1); //끝페이지

      if (pageData.current == "1") {
        pagination += "<li disabled>◀</li>";
      } else {
        pagination += "<li>◀</li>";
      }
      let maxPage = pageData.total < endPage ? pageData.total : endPage;
      for (let i = startPage; i <= maxPage; i++) {
        if (pageData.current == i) {
          pagination += "<li id='currnetPage' disabled>" + i + "</li>";
        } else {
          pagination += "<li>" + i + "</li>";
        }
      }

      if (pageData.current == pageData.total) {
        pagination += "<li disabled>▶</li>";
      } else {
        pagination += "<li>▶</li>";
      }

      $(".s_paging").html(pagination);
    },
  });
}

//검색 결과 point 배치 함수
function setSearchPOINT(x, y, i) {
  var layerList = new Module.JSLayerList(true);
  layerList.delLayerAtName("Search_POI"); // 이전 검색 POINT 레이어 삭제
  var layer = layerList.createLayer("Search_POI", Module.ELT_3DPOINT); // 새 검색 POINT 레이어 생성
  layer.setMaxDistance(50000000); //레이어 최대 가시범위
  x *= 1;
  y *= 1;

  //POI 이미지 생성
  var img = new Image();
  img.onload = function () {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    GLOBAL.pointIdx++;
    var point = Module.createPoint("point_" + GLOBAL.pointIdx);
    point.setPosition(new Module.JSVector3D(x, y, 10));
    point.setImage(
      ctx.getImageData(0, 0, this.width, this.height).data,
      this.width,
      this.height
    );
    layer.addObject(point, 0);
  };
  img.layer = layer;
  img.src = "/XDdata/num/icon_list_" + (i + 1) + ".png";
}

//##실습 5. 기본 객체 관리
// 1)기본 객체 생성(포인트, 라인, 폴리곤)
//메뉴 선택 -> 클릭 후 객체 생성 -> 마우스 지도 이동 모드로 자동변경
//삭제모드 -> 마우스 클릭시 객체 삭제 and 객체 전체 삭제
function drawInterection(num) {
  switch (num) {
    case 1:
      drawPoint();
      break;
    case 2:
      drawLine();
      break;
    case 3:
      drawPolygon();
      break;
    case 0:
      removeEntity();
      break;
  }
}

//point 생성
function drawPoint() {
  Module.canvas.onmousedown = function (e) {
    var screenPosition = new Module.JSVector2D(e.x - 405, e.y);

    // 화면->지도 좌표 변환
    var mapPosition = Module.map.ScreenToMapPointEX(screenPosition);

    lon = parseFloat(mapPosition.Longitude).toFixed(6);
    lat = parseFloat(mapPosition.Latitude).toFixed(6);
    alt = parseFloat(mapPosition.Altitude).toFixed(6);

    // POI 오브젝트를 추가 할 레이어 생성
    var layerList = new Module.JSLayerList(true);
    var layer = layerList.nameAtLayer("POI_Layer");
    if (layerList.nameAtLayer("POI_Layer") == null) {
      //레이어가 생성되어 있는지 체크
      layer = layerList.createLayer("POI_Layer", Module.ELT_3DPOINT);
    }

    //POI 이미지 생성
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      GLOBAL.pointIdx++;
      var point = Module.createPoint("point_" + GLOBAL.pointIdx);
      point.setPosition(new Module.JSVector3D(Number(lon), Number(lat), 10));
      point.setImage(
        ctx.getImageData(0, 0, this.width, this.height).data,
        this.width,
        this.height
      );
      this.layer.addObject(point, 0);
    };
    img.layer = layer;
    img.src = "/XDdata/pin.png";

    Module.canvas.onmousedown = "return false;"; //onmousedown이벤트 핸들러 해제
    Module.XDSetMouseState(1); //마우스 지도 이동 모드
  };
}

//line 생성
function drawLine() {
  Module.XDSetMouseState(21); //마우스 라인입력 모드

  Module.canvas.onmouseup = function (e) {
    var inputPoint = Module.map.getInputPoints(); //입력된 좌표 리스트 반환

    if (inputPoint.count() < 2) {
      //입력된 좌표가 2개가 아닐 경우 리턴
      return;
    }

    var layerList = new Module.JSLayerList(true);
    //LINE Object를 추가할 레이어 생성
    var layer = layerList.createLayer("LINE_Layer", Module.ELT_3DLINE);

    let corArr = []; //라인 버텍스를 저장할 배열
    for (var i = 0; i < inputPoint.count(); i++) {
      // 입력한 점 위치에서 고도 10m로 고정시킨 후 버텍스 추가
      var point = inputPoint.get(i);
      corArr.push([point.Longitude, point.Latitude, 10.0]);
    }

    let coordinates = {
      coordinate: corArr,
      style: "XYZ", //style에 따른 배열 관계
    };

    let lineObj = createNormalLine(coordinates); //line 속성

    //라인 아이디
    GLOBAL.lineIdx++;
    let lineId = "LINE_" + GLOBAL.lineIdx;

    let line = Module.createLineString(lineId); //line object 생성
    line.createbyJson(lineObj); //지정된 속성정보 추가

    //레이어에 추가
    layer.addObject(line, 0);

    Module.map.clearInputPoint(); //입력점 초기화
    Module.XDSetMouseState(1); //마우스 지도이동 모드
    Module.canvas.onmouseup = "return false;"; //onmouseup 이벤트 핸들러 해제
  };
}

//line 설정
function createNormalLine(coordinates) {
  let data = {
    coordinates: coordinates,
    type: 0, // 실선 생성
    union: false, // 지형 결합 유무
    depth: false, // 오브젝트 겹침 유무
    color: new Module.JSColor(255, 255, 0, 0), // ARGB 설정
    width: 3, // 선 굵기
  };
  return data;
}

//polygon 생성
function drawPolygon() {
  Module.XDSetMouseState(21); //마우스 라인 입력 모드
  Module.canvas.ondblclick = function (e) {
    var inputPoint = Module.map.getInputPoints(); //입력된 좌표 리스트 반환
    var inputPointCnt = inputPoint.count(); // 입력된 좌표의 개수 반환

    if (inputPoint.count() < 3) {
      //입력된 좌표가 3개 미만일 경우 리턴
      return;
    }

    //폴리곤 객체를 저장할 레이어 생성( 이미 생성한 경우 레이어 반환 )
    var layerList = new Module.JSLayerList(true);
    var layer = layerList.nameAtLayer("POLYGON_Layer");
    if (layer == null) {
      //레이어가 없는 경우 새로 생성
      layer = layerList.createLayer("POLYGON_Layer", Module.ELT_POLYHEDRON);
    }

    // 폴리곤 객체 생성
    GLOBAL.polygonIdx++;
    var polygonId = "POLYGON_" + GLOBAL.polygonIdx;
    var polygon = Module.createPolygon(polygonId);

    // 폴리곤 색상 설정
    var polygonStyle = new Module.JSPolygonStyle();
    polygonStyle.setFill(true);
    polygonStyle.setFillColor(new Module.JSColor(102, 051, 153, 0.1));

    // 폴리곤 아웃라인 설정
    polygonStyle.setOutLine(true);
    polygonStyle.setOutLineWidth(2.0);
    polygonStyle.setOutLineColor(new Module.JSColor(100, 255, 228, 0.5));

    polygon.setStyle(polygonStyle);

    // 입력한 지점(inputPoint, part)으로 폴리곤 형태 정의
    var part = new Module.Collection();
    part.add(inputPointCnt);

    var vertex = new Module.JSVec3Array();
    for (var i = 0; i < inputPointCnt; i++) {
      // 입력한 점 위치에서 고도 5m 를 상승시킨 후 버텍스 추가
      var point = inputPoint.get(i);
      vertex.push(
        new Module.JSVector3D(
          point.Longitude,
          point.Latitude,
          point.Altitude + 5.0
        )
      );
    }

    polygon.setPartCoordinates(vertex, part);

    // 레이어에 객체 추가
    layer.addObject(polygon, 1);

    Module.canvas.ondblclick = "return false;"; // ondblclick이벤트 핸들러 해제
    Module.map.clearInputPoint(); // 입력점 초기화
    Module.XDSetMouseState(1); // 마우스 지도 이도 ㅇ모드
  };
}

//마우스 클릭 삭제모드
function removeEntity() {
  Module.XDSetMouseState(6); //마우스 객체 선택 모드
  Module.map.clearInputPoint(); //입력점 초기화

  //해당 이벤트 핸들러가 존재하지 않을 경우에만 이벤트 핸들러 생성
  if (!GLOBAL.events.selectobject) {
    GLOBAL.events.selectobject = true;
    Module.canvas.addEventListener("Fire_EventSelectedObject", function (e) {
      var objLayer = "POI_LayerLINE_LayerPOLYGON_Layer";
      if (!objLayer.includes(e.layerName)) {
        //레이어가 POI_Layer LINE_Layer POLYGON_Layer 셋 중 하나가 아닐 경우
        Module.map.clearSelectObj(); // 객체 선택 취소
        return;
      }

      // 사용자 레이어 리스트에서 객체 키를 사용해 객체 반환
      var layerList = new Module.JSLayerList(true);
      var layer = layerList.nameAtLayer(e.layerName);
      if (layer != null) {
        layer.removeAtKey(e.objKey); //object 삭제
      }
    });
  }
}

//기본 객체 전체 삭제
function removeAllEntity() {
  var layerList = new Module.JSLayerList(true);
  var layerPOI = layerList.nameAtLayer("POI_Layer");
  var layerLINE = layerList.nameAtLayer("LINE_Layer");
  var layerPOLYGON = layerList.nameAtLayer("POLYGON_Layer");

  //각 레이어에서 전체 object 삭제
  layerPOI.removeAll();
  layerLINE.removeAll();
  layerPOLYGON.removeAll();
}

//##실습 5. 기본 객체 관리
// 2)기본 분석기능 (거리 측정, 면적 측정)

function measureInteration(val, flag) {
  let layerList = new Module.JSLayerList(true);
  if (layerList.nameAtLayer("MEASURE_POI") == null) {
    let layer = layerList.createLayer("MEASURE_POI", Module.ELT_3DPOINT);
    layer.setMaxDistance(20000.0);
    layer.setSelectable(false);
    Module.getOption().SetAreaMeasurePolygonDepthBuffer(false); // WEBGL GL_DEPTH_TEST 설정
    Module.getOption().SetDistanceMeasureLineDepthBuffer(false); // WEBGL GL_DEPTH_TEST 설정
  }
  if (flag) {
    switch (val) {
      case "distance": //거리측정
        $("#area").prop("checked", false);
        Module.XDSetMouseState(Module.MML_ANALYS_DISTANCE_STRAIGHT);
        // 콜백 함수 설정 지속적으로 사용
        Module.getOption().callBackAddPoint(addDistancePoint); // 마우스 입력시 발생하는 콜백 성공 시 success 반환 실패 시 실패 오류 반환
        Module.getOption().callBackCompletePoint(endPoint); // 측정 종료(더블클릭) 시 발생하는 콜백 성공 시 success 반환 실패 시 실패 오류 반환
        break;
      case "area": //면적측정
        $("#distance").prop("checked", false);
        Module.XDSetMouseState(Module.MML_ANALYS_AREA_PLANE);
        // 콜백 함수 설정 지속적으로 사용
        Module.getOption().callBackAddPoint(addAreaPoint); // 마우스 입력시 발생하는 콜백 성공 시 success 반환 실패 시 실패 오류 반환
        Module.getOption().callBackCompletePoint(endPoint); // 측정 종료(더블클릭) 시 발생하는 콜백 성공 시 success 반환 실패 시 실패 오류 반환
        break;
    }
  } else {
    Module.XDSetMouseState(Module.MML_MOVE_GRAB); //마우스 모드 1로 변경
  }
}

let m_mercount = 0; // 측정 오브젝트 갯수
let m_objcount = 0; // 측정 오브젝트를 표시하는 POI 갯수

/* callBackAddPoint에 지정된 함수 [마우스 왼쪽 클릭 시 이벤트 발생]*/
function addAreaPoint(e) {
  // e 구성요소
  // dLon, dLat, dAlt : 면적 중심 좌표(경위 고도)
  // dArea			: 면적 크기
  createPOI(
    new Module.JSVector3D(e.dLon, e.dLat, e.dAlt),
    "rgba(255, 204, 198, 0.8)",
    e.dArea,
    true
  );
}

/* callBackAddPoint에 지정된 함수 [마우스 왼쪽 클릭 시 이벤트 발생]*/
function addDistancePoint(e) {
  // e 구성요소
  // dMidLon, dMidLat, dMidAlt : 이전 입력 된 지점과 현재 지점을 중점(경위 고도)
  // dLon, dLat, dAlt : 현재 입력 된 지점(경위 고도)
  // dDistance		: 현재 점과 이전 점과의 길이
  // dTotalDistance	: 모든 점과의 길이

  let partDistance = e.dDistance,
    totalDistance = e.dTotalDistance;

  if (partDistance == 0 && totalDistance == 0) {
    m_objcount = 0; // POI 갯수 초기화
    createPOI(
      new Module.JSVector3D(e.dLon, e.dLat, e.dAlt),
      "rgba(255, 204, 198, 0.8)",
      "Start",
      true
    );
  } else {
    if (e.dDistance > 0.01) {
      createPOI(
        new Module.JSVector3D(e.dMidLon, e.dMidLat, e.dMidAlt),
        "rgba(255, 255, 0, 0.8)",
        e.dDistance,
        false
      );
    }
    createPOI(
      new Module.JSVector3D(e.dLon, e.dLat, e.dAlt),
      "rgba(255, 204, 198, 0.8)",
      e.dTotalDistance,
      true
    );
  }
}

/* callBackCompletePoint에 지정된 함수 [마우스 더블 클릭 시 이벤트 발생]*/
function endPoint(e) {
  m_mercount++;
}

//=============================================== POI 생성 과정
/* 정보 표시 POI */
function createPOI(_position, _color, _value, _balloonType) {
  // 매개 변수
  // _position : POI 생성 위치
  // _color : drawIcon 구성 색상
  // _value : drawIcon 표시 되는 텍스트
  // _balloonType : drawIcon 표시 되는 모서리 옵션(true : 각진 모서리, false : 둥근 모서리)

  // POI 아이콘 이미지를 그릴 Canvas 생성
  var drawCanvas = document.createElement("canvas");
  // 캔버스 사이즈(이미지 사이즈)
  drawCanvas.width = 100;
  drawCanvas.height = 100;

  // 아이콘 이미지 데이터 반환
  let imageData = drawIcon(drawCanvas, _color, _value, _balloonType);

  let Symbol = Module.getSymbol();

  let layerList = new Module.JSLayerList(true);
  let layer = layerList.nameAtLayer("MEASURE_POI");

  // POI가 존재 하면 삭제 후 생성
  let key = m_mercount + "_POI";
  layer.removeAtKey(key);

  // POI 생성 과정
  if (_balloonType) {
    //전체 결과 말풍선
    poi = Module.createPoint(m_mercount + "_POI");
  } else {
    //거리 측정 지점간 거리 말풍선
    poi = Module.createPoint(m_mercount + "_POI" + m_objcount);
    m_objcount++;
  }

  poi.setPosition(_position); // 위치 설정
  poi.setImage(imageData, drawCanvas.width, drawCanvas.height); // 아이콘 설정
  layer.addObject(poi, 0); // POI 레이어 등록
}

/* 아이콘 이미지 데이터 반환 */
function drawIcon(_canvas, _color, _value, _balloonType) {
  // 컨텍스트 반환 및 배경 초기화
  var ctx = _canvas.getContext("2d"),
    width = _canvas.width,
    height = _canvas.height;
  ctx.clearRect(0, 0, width, height);

  // 배경 Draw Path 설정 후 텍스트 그리기
  if (_balloonType) {
    drawBalloon(ctx, height * 0.5, width, height, 5, height * 0.25, _color);
    setText(ctx, width * 0.5, height * 0.2, _value);
  } else {
    drawRoundRect(ctx, 0, height * 0.3, width, height * 0.25, 5, _color);
    setText(ctx, width * 0.5, height * 0.5, _value);
  }

  return ctx.getImageData(0, 0, _canvas.width, _canvas.height).data;
}

/* 말풍선 배경 그리기 */
function drawBalloon(
  ctx,
  marginBottom,
  width,
  height,
  barWidth,
  barHeight,
  color
) {
  var wCenter = width * 0.5,
    hCenter = height * 0.5;

  // 말풍선 형태의 Draw Path 설정
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height - barHeight - marginBottom);
  ctx.lineTo(wCenter - barWidth, height - barHeight - marginBottom);
  ctx.lineTo(wCenter, height - marginBottom);
  ctx.lineTo(wCenter + barWidth, height - barHeight - marginBottom);
  ctx.lineTo(width, height - barHeight - marginBottom);
  ctx.lineTo(width, 0);
  ctx.closePath();

  // 말풍선 그리기
  ctx.fillStyle = color;
  ctx.fill();
}

/* 둥근 사각형 배경 그리기 */
function drawRoundRect(ctx, x, y, width, height, radius, color) {
  if (width < 2 * radius) radius = width * 0.5;
  if (height < 2 * radius) radius = height * 0.5;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();

  // 사각형 그리기
  ctx.fillStyle = color;
  ctx.fill();

  return ctx;
}

/* 텍스트 그리기 */
function setText(_ctx, _posX, _posY, _value) {
  var strText = "";

  // 텍스트 문자열 설정
  var strText = setTextComma(_value.toFixed(2)) + "㎡";

  // 텍스트 스타일 설정
  _ctx.font = "bold 16px sans-serif";
  _ctx.textAlign = "center";
  _ctx.fillStyle = "rgb(0, 0, 0)";

  // 텍스트 그리기
  _ctx.fillText(strText, _posX, _posY);
}

/* 단위 표현 */
function setTextComma(str) {
  str = String(str);
  return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, "$1,");
}

/* 분석 내용 초기화 */
function clearAnalysis() {
  // 실행 중인 분석 내용 초기화
  Module.XDClearAreaMeasurement();
  Module.XDClearDistanceMeasurement();

  m_mercount = 0;
  m_objcount = 0;
  // 레이어 삭제
  let layerList = new Module.JSLayerList(true);
  let layer = layerList.nameAtLayer("MEASURE_POI");
  layer.removeAll();
}

//##실습 6. 모델객체 관리
// 1) vworld 건물 관리
// 텍스쳐 모드 -> vworld 건물 기본 텍스쳐 or 심플모드
function addVWorldBuilding(val) {
  Module.XDSetMouseState(1); // 마우스 지도 이동 모드

  if (val) {
    //vworld 건물 레이어 추가
    Module.XDEMapCreateLayer(
      "facility_build",
      "https://xdworld.vworld.kr",
      0,
      true,
      true,
      false,
      9,
      0,
      15
    );
    Module.setVisibleRange("facility_build", 3.0, 100000.0);
    //심플모드
    Module.map.setSimpleMode(true);
  } else {
    //vworld 건물 레이어 삭제
    Module.XDEMapRemoveLayer("facility_build");

    //마우스 클릭 건물 삭제, 텍스쳐 모드 checked 상태 false로 변환
    $("#rm_vbuilding").attr("checked", false);
    $("#change_texture").attr("checked", false);
  }
}

//vworld 건물 삭제
function removeVWorldBuilding(val) {
  if (!val) {
    Module.XDSetMouseState(1); //마우스 지도 이동 모드
    return;
  }

  var layerlist = new Module.JSLayerList(false); //서비스 레이어 리스트 반환
  Module.XDSetMouseState(6); //객체 선택 모드

  //해당 이벤트 핸들러가 존재하지 않을 경우에만 이벤트 핸들러 추가
  if (!GLOBAL.events.selectbuilding) {
    GLOBAL.events.selectbuilding = true;
    Module.canvas.addEventListener("Fire_EventSelectedObject", function (e) {
      if (e.layerName == "facility_build") {
        layerlist
          .nameAtLayer("facility_build")
          .keyAtObject(e.objKey)
          .setVisible(false); //가시화 옵션 설정
        Module.map.clearSelectObj(); // 객체 선택 해제
      } else {
        Module.map.clearSelectObj();
      }
    });
  }
}

//VWORLD 건물 텍스처 모드
function setBuildingTexture(val) {
  //vworld 건물 레이어가 없을 경우, 취소
  if (!$("#VWorldBuilding").prop("checked")) {
    $("#change_texture").prop("checked", false);
    return;
  }

  if (val) {
    Module.map.setSimpleMode(false); //심플모드 해제
  } else {
    Module.map.setSimpleMode(true);
  }
}

//##실습 6. 모델객체 관리
// 2) 파일객체 추가 (고스트심볼 객체를 이용한 3D 모델)
//	3D파일 -> XDdata폴더
//	객체 추가 시, 해당 위치로 이동
function addModelEntity(val, mName, height) {
  var layerlist = new Module.JSLayerList(true);
  //고스트심볼 레이어 생성
  if (GLOBAL.ghostSymbolLayer == null) {
    //레이어가 없을때 생성
    GLOBAL.ghostSymbolLayer = layerlist.createLayer(
      "GHOST_SYMBOL_LAYER",
      Module.ELT_GHOST_3DSYMBOL
    );
    GLOBAL.ghostSymbolMap = Module.getGhostSymbolMap(); //고스트심볼맵 객체 반환
  }

  if (!val) {
    //해당 key의 고스트심볼 object 숨김
    GLOBAL.ghostSymbolLayer.keyAtObject(mName).setVisible(false);
    if (mName == "Airship") {
      stopCarAnimation();
    }
    return;
  }

  stopCarAnimation(); //애니메이션 종료

  //모델 위치로 카메라 이동
  var camera = Module.getViewCamera();
  camera.setLocation(new Module.JSVector3D(127.099136, 37.49913, 1000));
  camera.setTilt(90);

  //고스트심볼맵에 이미 존재하는 모델데이터일 경우,
  var g = Module.getGhostSymbolMap().isExistID(mName);
  if (g) {
    //해당 key의 고스트심볼 object 가시화
    GLOBAL.ghostSymbolLayer.keyAtObject(mName).setVisible(true);
    if (mName == "Airship") {
      //비행선일 경우 처음 position으로 이동
      GLOBAL.ghostSymbolLayer
        .keyAtObject(mName)
        .setPosition(new Module.JSVector3D(127.1, 37.5, 100)); //출발지점으로 이동
    }
    return;
  }

  //3d모델 생성

  //객체 position 지정
  let position =
    mName == "Airship"
      ? [127.1, 37.5, 100]
      : [127.1 - height * 0.000009, 37.499103, mName == "drone" ? 100 : 15];

  //고스트심볼 객체 생성
  Module.getGhostSymbolMap().insert({
    id: mName,
    url: "/XDdata/" + mName + ".3ds",
    callback: function (e) {
      // 텍스쳐 설정
      Module.getGhostSymbolMap().setModelTexture({
        id: e.id,
        face_index: 0,
        url: "/XDdata/" + mName + ".jpg",
        callback: function (e) {
          // console.log(e.id);
        },
      });

      // 오브젝트 생성 및 레이어 추가
      var object = createGhostSymbol(mName, e.id, position);
      if (mName == "Airship") {
        object.setRotation(0, 180, 0);
      }
      GLOBAL.ghostSymbolLayer.addObject(object, 0);
    },
  });
}

/* 고스트 심볼 모델 오브젝트 생성 */
function createGhostSymbol(_objectKey, _modelKey, _position) {
  //고스트 심볼 객체 생성
  var newModel = Module.createGhostSymbol(_objectKey);

  // base point 설정
  var modelHeight = GLOBAL.ghostSymbolMap.getGhostSymbolSize(_modelKey);

  //위치 및 크기 옵션 설정
  newModel.setBasePoint(0, -modelHeight.height * 0.5, 0);
  newModel.setRotation(0, 90.0, 0);
  newModel.setScale(
    _objectKey == "drone"
      ? new Module.JSSize3D(0.1, 0.1, 0.1)
      : new Module.JSSize3D(1.0, 1.0, 1.0)
  );
  newModel.setGhostSymbol(_modelKey);
  newModel.setPosition(
    new Module.JSVector3D(_position[0], _position[1], _position[2])
  );

  return newModel;
}

//모델 객체 전체 삭제
function removeAll3DEntity() {
  Module.canvas.onmousedown = "return false;";
  Module.canvas.onmousemove = "return false;";
  Module.canvas.onmouseup = "return false;";

  //고스트 심볼 레이어 반환
  var layerlist = new Module.JSLayerList(true);
  var layer = layerlist.nameAtLayer("GHOST_SYMBOL_LAYER");
  var objlist;
  if (layer != null) {
    //레이어에 포함된 object의 key리스트 string 형태로 반환
    objlist = layer.getObjectKeyList();
    if (objlist != null) {
      objlist = objlist.split(",");

      for (let i = 0; i < objlist.length - 1; i++) {
        layer.keyAtObject(objlist[i]).setVisible(false); //오브젝트 숨김
      }
    }
  }

  $(".modelObject input[type=checkbox]").attr("checked", false);

  //마우스 클릭 객체 삭제
  layer = layerlist.nameAtLayer("RClickLayer");
  if (layer != null) {
    objlist = layer.getObjectKeyList();
    if (objlist != null) {
      objlist = objlist.split(",");
      for (let i = 0; i < objlist.length - 1; i++) {
        layer.removeAtKey(objlist[i]);
      }
    }
  }

  // stopCarAnimation();//애니메이션 종료
}

/**객체 애니메이션 이벤트시 마우스이벤트 */
let mousedownE = function (e) {
  GLOBAL.MOUSE_BUTTON_PRESS = true;
};
let mouseupE = function (e) {
  GLOBAL.MOUSE_BUTTON_PRESS = false;
};
let mousemoveE = function (e) {
  if (GLOBAL.MOUSE_BUTTON_PRESS) {
    if (e.buttons == 2) {
      GLOBAL.TRACE_TARGET.direction += e.movementX * 0.1;
      GLOBAL.TRACE_TARGET.tilt += e.movementY * 0.1;
    }
  }
};
let mouseWheelE = function (e) {
  if (e.wheelDelta < 0) {
    GLOBAL.TRACE_TARGET.distance *= 1.1;
  } else {
    GLOBAL.TRACE_TARGET.distance *= 0.9;
  }
};

/**## 실습7. 객체이동&이벤트
 * 1)애니메이션 설정
 * - 비행선 3D 모델 객체 생성
 * - 참고 사이트 -> http://sandbox.dtwincloud.com/code/main.do?id=camera_trace_path_moving
 */
function playCarAnimation() {
  //비행선 오브젝트가 존재하지 않을 경우 취소
  if (GLOBAL.ghostSymbolLayer != null) {
    var airship = GLOBAL.ghostSymbolLayer.keyAtObject("Airship");
    if (airship == null || !airship.getVisible()) {
      return;
    }
  } else {
    return;
  }

  var camera = Module.getViewCamera();
  // 마우스 이벤트 설정
  Module.canvas.addEventListener("mousedown", mousedownE);
  Module.canvas.addEventListener("mouseup", mouseupE);
  Module.canvas.addEventListener("mousemove", mousemoveE);

  Module.canvas.addEventListener("wheel", mouseWheelE);

  // 경로 저장
  GLOBAL.MOVE_PATH = createPath([
    [127.09999, 37.496261, 3.1252494417130947],
    [127.101792, 37.495967, 3.1252494417130947],
    [127.103676, 37.496446, 3.1252494417130947],
    [127.102788, 37.498322, 3.1252494417130947],
    [127.099263, 37.497256, 3.1252494417130947],
    [127.09999, 37.496261, 3.1252494417130947],
  ]);

  //객체 반환
  var layerlist = new Module.JSLayerList(true);
  var layer = layerlist.nameAtLayer("GHOST_SYMBOL_LAYER");
  var obj = layer.keyAtObject("Airship");

  //애니메이션 대상 객체 설정
  var traceTarget = Module.createTraceTarget(obj.getId());
  //카메라 설정
  traceTarget.set({
    object: obj,
    tilt: 45.0,
    direction: 0.0,
    distance: 500.0,
  });
  GLOBAL.TRACE_TARGET = traceTarget;
  camera.setTraceTarget(GLOBAL.TRACE_TARGET);
  camera.setTraceActive(true);
  Module.XDRenderData();

  //이동 실행
  move(0);
}

//애니메이션 멈춤
function stopCarAnimation() {
  clearTimeout(GLOBAL.CURRENT_MOVEMENT);
  GLOBAL.CURRENT_MOVEMENT = null;
  var camera = Module.getViewCamera();
  camera.setTraceActive(false);
  camera.setTilt(90);
  camera.setLocation(new Module.JSVector3D(127.10028, 37.497208, 1000));

  Module.canvas.removeEventListener("mousedown", mousedownE);
  Module.canvas.removeEventListener("mouseup", mouseupE);
  Module.canvas.removeEventListener("mousemove", mousemoveE);

  Module.canvas.removeEventListener("wheel", mouseWheelE);
}

/* 이동 실행 */
function move(_index) {
  var camera = Module.getViewCamera();

  // 현재 위치가 이동 경로의 마지막 지점이면 이동 종료
  if (_index >= GLOBAL.MOVE_PATH.count()) {
    stopCarAnimation();
    return;
  }

  // 다음 이동 점의 지형 고도 반환 후 타겟 오브젝트 이동
  var position = GLOBAL.MOVE_PATH.get(_index);
  var altitude = Module.map.getTerrHeightFast(
    position.Longitude,
    position.Latitude
  );
  GLOBAL.TRACE_TARGET.getObject().setPosition(
    new Module.JSVector3D(position.Longitude, position.Latitude, altitude)
  );

  // 시간 간격으로 두고 다음 지점으로 이동
  GLOBAL.CURRENT_MOVEMENT = setTimeout(function () {
    move(_index + 1);
  }, 50);
}

/* 이동 경로 생성 */
function createPath(_pathPoint) {
  var input = new Module.JSVec3Array();
  for (var i = 0; i < _pathPoint.length; i++) {
    input.push(
      new Module.JSVector3D(
        _pathPoint[i][0],
        _pathPoint[i][1],
        _pathPoint[i][2]
      )
    );
  }

  return Module.map.GetPathIntervalPositions(input, 1.0, false);
}

/**## 실습7. 객체이동&이벤트
 * 2) 마우스로 객체 추가 & 삭제
 * - 마우스 클릭 시 3D 모델 객체 추가& 삭제
 */
function setMouseRClickEvent(val, id) {
  $("#" + (id == "RCL_DELETE" ? "RCL_MAKE" : "RCL_DELETE")).attr(
    "checked",
    false
  );

  Module.canvas.onmousedown = "return false;";
  Module.canvas.onmousemove = "return false;";
  Module.canvas.onmouseup = "return false;";
  if (!val) {
    Module.XDSetMouseState(1); //지도 이동 모드
    return;
  }

  if (id == "RCL_DELETE") {
    //클릭 시 객체 삭제

    Module.XDSetMouseState(6); //객체 선택 모드

    //해당 이벤트 핸들러가 존재하지 않을 경우에만 이벤트 핸들러 생성
    if (!GLOBAL.events.selectghostsymbol) {
      GLOBAL.events.selectghostsymbol = true;
      Module.canvas.addEventListener("Fire_EventSelectedObject", function (e) {
        if (e.layerName == "RClickLayer") {
          let layerList = new Module.JSLayerList(true);
          let layer = layerList.nameAtLayer(e.layerName);
          layer.removeAtKey(e.objKey); //오브젝트 삭제
        } else {
          Module.map.clearSelectObj();
        }
      });
    }
  } else {
    //클릭 시 객체 생성
    Module.XDSetMouseState(1); //지도 이동 모드
    let mTag = false;
    Module.canvas.onmousedown = function () {
      mTage = true;
    };
    Module.canvas.onmousemove = function () {
      mTage = false;
    };
    Module.canvas.onmouseup = function (e) {
      //드래그 할 경우 객체 추가 취소
      if (!mTage) {
        return;
      }

      var mapPosition = Module.map.ScreenToMapPointEX(
        new Module.JSVector2D(e.x - 405, e.y)
      );

      let lon = parseFloat(mapPosition.Longitude).toFixed(6);
      let lat = parseFloat(mapPosition.Latitude).toFixed(6);
      let alt = Module.map.getTerrHeight(Number(lon), Number(lat)); //좌표의 alt값 반환

      //고스트 심볼 레이어가 있을 경우 반환, 없을 경우 생성
      let layerList = new Module.JSLayerList(true);
      let layer = layerList.nameAtLayer("RClickLayer");
      if (layer == null) {
        layer = layerList.createLayer("RClickLayer", Module.ELT_GHOST_3DSYMBOL);
      }
      GLOBAL.ghostSymbolLayer = layer;
      GLOBAL.ghostSymbolMap = Module.getGhostSymbolMap();

      let url3D = "/XDdata/church3D.xdo"; //3d파일 경로
      let position = [Number(lon), Number(lat), alt]; //위치
      let RCid = "RClickObj_" + GLOBAL.RCidx++; //오브젝트 id

      Module.getGhostSymbolMap().insert({
        id: RCid,
        url: url3D,
        callback: function (e) {
          // 텍스쳐 설정
          Module.getGhostSymbolMap().setModelTexture({
            id: e.id,
            face_index: 0,
            url: "/XDdata/church3D.jpg",
            callback: function (e) {},
          });

          // 오브젝트 생성 및 레이어 추가
          var object = createGhostSymbol(RCid, e.id, position);
          GLOBAL.ghostSymbolLayer.addObject(object, 0);
        },
      });
    };
  }
}

/**## 실습 8. 레이어 추가
 * 1) wms 레이어 추가
 * 	- vworld wms api 이용
 *  - 프록시 설정(app.js 파일 참고)
 */
function addWmsLayer(val, layerName) {
  let layerList = new Module.JSLayerList(false);
  let wmslayer = layerList.nameAtLayer("wmslayer_" + layerName); //wms레이어 반환
  if (!val) {
    layerList.setVisible("wmslayer_" + layerName, false); //wms레이어 숨김
    return;
  } else if (wmslayer != null) {
    layerList.setVisible("wmslayer_" + layerName, true); //wms레이어 가시화
    return;
  }

  Module.SetProxy("./proxywms?"); //프록시 설정

  let slopeoption = {
    url: "",
    layer: layerName,
    minimumlevel: 0,
    maximumlevel: 15,
    crs: "EPSG:4326",
    parameters: {
      key: "B9ECCC18-DD44-3F46-A14B-EFFF588CF200", //api key
      request: "GetMap",
      styles: layerName == "lt_c_upisuq161" ? layerName : layerName + "_3d",
      version: "1.3.0", //wms version
      domain: "localhost:8080", //api 신청 주소
      format: "image/png",
      transparent: "true",
      bbox: "-180,-90,0,90",
    },
  };
  wmslayer = layerList.createWMSLayer("wmslayer_" + layerName); //wms레이어 생성
  wmslayer.setBBoxOrder(false); //BBOX설정
  wmslayer.setWMSProvider(slopeoption); // WMS 레이어 정보 셋팅
  wmslayer.setProxyRequest(true); // 레이어 프록시 사용
}

/**## 실습 8. 레이어 추가
 * 1) wfs 레이어 추가
 * 	- vworld wfs api 이용
 *  - 프록시 설정(app.js 파일 참고)
 */
function addWfsLayer(val, layerName) {
  if (layerName == "lt_c_wkmstrm") {
    layerName = "lt_c_ud801";
  }
  if (val) {
    let param = {
      service: "WFS",
      request: "GetFeature",
      version: "1.1.0",
      maxFeatures: 50,
      output: "application/json",
      key: "B9ECCC18-DD44-3F46-A14B-EFFF588CF200",
      DOMAIN: "localhost:8080",
      crs: "EPSG:4326",
      srsname: "EPSG:4326",
      typename: layerName,
    };

    $.ajax({
      method: "get",
      url: "/proxywfs",
      data: param,
      success: function (data) {
        var layerList = new Module.JSLayerList(true);
        let layer = layerList.createLayer(layerName + "_Layer", 1); //레이어 생성

        if (layerName == "lt_p_moctnode") {
          createWFSPoint(data.features, layer); //point 생성
        } else {
          createWFSPolygon(data.features, layer); //polygon 생성
        }
      },
      error: function (e) {
        console.log(e);
      },
    });
  } else {
    let layerList = new Module.JSLayerList(true);
    layerList.delLayerAtName(layerName + "_Layer"); //wfs레이어 삭제
    return;
  }
}

//wfs polygon 생성
function createWFSPolygon(featuresArr, layer) {
  for (let k = 0; k < featuresArr.length; k++) {
    let f = featuresArr[k];

    let polygon = Module.createPolygon(f.id); //id로 polygon 객체 생성
    let color = new Module.JSColor(170, 153, 153, 153);
    let outline = new Module.JSColor(12, 153, 153, 153);

    // 폴리곤 색상 설정
    var polygonStyle = new Module.JSPolygonStyle();
    polygonStyle.setFill(true);
    polygonStyle.setFillColor(color);

    // 폴리곤 아웃라인 설정
    polygonStyle.setOutLine(true);
    polygonStyle.setOutLineWidth(2.0);
    polygonStyle.setOutLineColor(outline);

    polygon.setStyle(polygonStyle);

    // 입력한 지점(inputPoint, part)으로 폴리곤 형태 정의
    var part = new Module.Collection();
    part.add(f.geometry.coordinates[0][0].length);

    var vertex = new Module.JSVec3Array();
    for (var i = 0; i < f.geometry.coordinates[0][0].length; i++) {
      // 입력한 점 위치에서 고도 5m 를 상승시킨 후 버텍스 추가
      var point = f.geometry.coordinates[0][0][i];
      vertex.push(new Module.JSVector3D(point[0], point[1], 50.0));
    }

    polygon.setPartCoordinates(vertex, part);
    polygon.setUnionMode(true); //지형결합 option

    // 레이어에 객체 추가
    layer.addObject(polygon, 0);
  }
  layer.setMaxDistance(50000000);
}

//wfs point 생성
function createWFSPoint(data, layer) {
  data.forEach((e) => {
    //이미지 포인트 생성
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      var point = Module.createPoint(e.id); //id로 point 객체 생성
      point.setPosition(
        new Module.JSVector3D(
          Number(e.geometry.coordinates[0]),
          Number(e.geometry.coordinates[1]),
          10
        )
      );
      point.setImage(
        ctx.getImageData(0, 0, this.width, this.height).data,
        this.width,
        this.height
      );
      layer.addObject(point, 0);
    };
    img.layer = layer;
    img.src = "/XDdata/map_pin.png";
    layer.setMaxDistance(50000000);
  });
}

/**## 실습 9. 현실 시뮬레이션
 * 1) 그림자 시뮬레이션
 */
function addShadowBuilding(val) {
  Module.XDSetMouseState(1); //지도 이동 모드
  if (val) {
    Module.XDEMapCreateLayer(
      "facility_build",
      "https://xdworld.vworld.kr",
      0,
      true,
      true,
      false,
      9,
      0,
      15
    ); //vworld 건물 레이어 생성
    Module.setVisibleRange("facility_build", 3.0, 100000.0);
    Module.map.setSimpleMode(false); //심플모드

    GLOBAL.Analysis.setAllObjectRenderShadow(true); //모든 객체의 그림자를 그리도록 설정
    GLOBAL.Analysis.setShadowSimulTerm(30); //그림자 시뮬레이션 시간 간격 설정
  } else {
    Module.XDEMapRemoveLayer("facility_build"); //vworld 건물 레이어 삭제
  }
}

//그림자 시뮬레이션 시작
function startShadowSimulation() {
  GLOBAL.Analysis.setShadowSimulTime(2022, 10, 5, 9, 00, 18, 00); //그림자 시뮬레이션 날짜(년도, 월, 일), 시작 시각(시간, 분), 종료 시각(시간, 분)을 설정
  GLOBAL.Analysis.setShadowSimulation(true); //그림자 시뮬레이션 실행
}

//그림자 시뮬레이션 멈춤
function stopShadowSimulation() {
  GLOBAL.Analysis.setShadowSimulation(false); //그림자 시뮬레이션 종료
}

/**## 실습 9. 현실 시뮬레이션
 * 1) 날씨 시뮬레이션- 눈효과 적용
 * 눈 이미지 -> XDdata
 */
function playSnowEffect() {
  Module.map.stopWeather(); //기상효과 종료
  Module.map.clearSnowfallArea(); //적설효과 초기화

  Module.map.startWeather(0, 5, 5); //기상효과 활성화
  Module.map.setSnowfall(1); //적설 효과 출력 타입을 설정
  Module.map.setSnowfallLevel(2.0); //적설량 설정
  Module.map.setSnowImageURL("/XDdata/snow_2.png"); //눈 이미지 경로
  Module.map.startWeather(0, 1, 1); //기상효과 재활성화
}

/**## 실습 9. 현실 시뮬레이션
 * 2) 날씨 시뮬레이션 - 비효과 적용
 * 비 이미지 -> XDdata
 */
function playRainEffect() {
  Module.map.stopWeather(); //기상효과 종료
  Module.map.clearSnowfallArea(); //적설효과 초기화
  Module.map.setSnowfall(0); //적설효과 해제

  Module.map.startWeather(1, 5, 5); //기상효과 활성화
  Module.map.setRainImageURL("/XDdata/rain_7_40.png"); //비 이미지 경로
  Module.map.startWeather(1, 5, 5); //기상효과 재활성화
}

/**## 실습 9. 현실 시뮬레이션
 * 3) 날씨 시뮬레이션 - 하늘 밝기
 */
function setSkyBright(val) {
  Module.map.stopWeather(); //기상효과 종료
  Module.map.clearSnowfallArea(); //적설효과 초기화
  Module.map.setSnowfall(0); //적설효과 해제

  Module.map.setFogLimitAltitude(6000000.0); //안개효과 적용 고도 제한
  Module.map.setFogEnable(true); //안개효과 적용
  color = new Module.JSColor(255, 10, 10, 10); //안개 색
  Module.map.setFog(color, 5.8, 1000, Number(val)); //안개효과 설정
  Module.XDRenderData();
}

/**## 실습 9. 현실 시뮬레이션
 * 4) 날씨 시뮬레이션 - 안개
 */
function setFogDensity(val) {
  Module.map.stopWeather(); //기상효과 종료
  Module.map.clearSnowfallArea(); //적설효과 초기화
  Module.map.setSnowfall(0); //적설효과 해제

  let dis = 5000 - val * 100; // 가시 범위

  Module.map.setFogLimitAltitude(6000000.0);
  Module.map.setFogEnable(true);

  color = new Module.JSColor(255, 255, 255, 255);
  Module.map.setFog(color, 5.8, dis, 0.9);
  Module.XDRenderData();
}

/**## 실습 9. 현실 시뮬레이션
 * 5) 날씨 시뮬레이션 - 기상효과 제거
 */
function removeWeatherEntity() {
  Module.map.stopWeather(); //기상효과 종료
  Module.map.clearSnowfallArea(); //적설효과 초기화
  Module.map.setSnowfall(0); //적설효과 해제
  Module.map.setFogEnable(false); //안개효과 해제
}

/**실습 10. 통계 표현
 * - 해양 데이터 -> XDdata > data.json
 * - GRID 통계 표현 (2D, 3D)
 */
function createSeriesSetter(type) {
  var layerList = new Module.JSLayerList(true);
  layerList.setVisible("LAYER_GRID_2D", false); //2D 레이어 숨김
  layerList.setVisible("LAYER_GRID_3D", false); //3D 레이어 숨김
  var layer;

  if (!type) {
    return;
  }

  let camera = Module.getViewCamera();
  camera.setLocation(new Module.JSVector3D(127.037288, 36.014688, 1000000));
  camera.move(new Module.JSVector3D(127.037288, 36.014688, 1000000), 90, 0, 1);

  //기존 레이어가 있다면 가시화, 없다면 생성
  if (layerList.nameAtLayer("LAYER_GRID_" + type) != null) {
    layerList.setVisible("LAYER_GRID_" + type, true);
    return;
  } else {
    layer = layerList.createLayer("LAYER_GRID_" + type, Module.ELT_POLYHEDRON);
  }

  $.getJSON("/XDdata/data.json", function (data) {
    // 그래프 생성
    var grid;
    if (type == "2D") {
      grid = createGrid_2D(data);
    } else if (type == "3D") {
      grid = createGrid_3D(data);
    }
    layer.addObject(grid, 0);
    layer.setMaxDistance(2000000.0);
    layer.setMinDistance(0.0);
  });
}

/* 2D 그리드 통계 생성 */
function createGrid_2D(_data) {
  gridData = _data.data.data;

  //그리드 객체 생성
  var grid = Module.createColorGrid("2D_GRID");

  //최대, 최소 rect와 셀 갯수에 따른 그리드 cell 위치 지정
  grid.SetGridCellDefaultColor(new Module.JSColor(0, 0, 0, 0));

  //그리드 셀의 위치 및 크기, 높이 설정
  var rowNum = 180,
    colNum = 160;

  grid.SetGridPosition(
    new Module.JSVector2D(124, 38.95),
    new Module.JSVector2D(133, 38.95),
    new Module.JSVector2D(133, 30.9),
    new Module.JSVector2D(124, 30.9),
    10000.0,
    rowNum,
    colNum
  );

  var gridCellColor = [
    new Module.JSColor(150, 215, 25, 28), //빨
    new Module.JSColor(150, 253, 174, 97), //주
    new Module.JSColor(150, 255, 255, 191), //노
    new Module.JSColor(150, 171, 221, 164), //초
    new Module.JSColor(150, 43, 131, 186), //파
  ];

  // 격자 cell line color 초기화
  grid.SetGridLineColor(new Module.JSColor(10, 255, 255, 255));

  for (var i = 0; i < gridData.length; i++) {
    var grade = 0;
    grade = gridData[i].grade;
    if (grade == 5) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[0]
      );
    } else if (grade == 4) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[1]
      );
    } else if (grade == 3) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[2]
      );
    } else if (grade == 2) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[3]
      );
    } else if (grade == 1) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[4]
      );
    }
  }

  grid.Create();
  return grid;
}

/* 3D 그리드 통계 생성 */
function createGrid_3D(_data) {
  var gridData = _data.data.data;
  //그리드 객체 생성
  var grid = Module.createColorGrid3D("3D_GRID");

  // 최대, 최소 rect와 셀 갯수에 따른 그리드 cell 위치 지정
  grid.SetGridCellDefaultColor(new Module.JSColor(0, 0, 0, 0));
  // 그리드 셀의 위치 및 크기, 높이 설정
  var rowNum = 180,
    colNum = 160;

  grid.SetGridPosition(
    new Module.JSVector2D(124, 38.95), // 그리드 좌상단
    new Module.JSVector2D(133, 38.95), // 그리드 우상단
    new Module.JSVector2D(133, 30.9), // 그리드 우하단
    new Module.JSVector2D(124, 30.9), // 그리드 좌하단
    1000.0, // 그리드 바닥면 고도
    rowNum, // 그리드 가로 셀 갯수
    colNum // 그리드 세로 셀 갯수
  );
  // 격자 cell line color 초기화
  for (var i = 0; i < 180; i++) {
    for (var j = 0; j < 160; j++) {
      grid.SetGridCellLineColor(i, j, new Module.JSColor(0, 255, 255, 255));
    }
  }
  // 값에 따른 그리드 셀 색상 리스트//컬러변경
  var gridCellColor = [
    new Module.JSColor(150, 215, 25, 28), //빨
    new Module.JSColor(150, 253, 174, 97), //주
    new Module.JSColor(150, 255, 255, 191), //노
    new Module.JSColor(150, 171, 221, 164), //초
    new Module.JSColor(150, 43, 131, 186), //파
  ];
  for (var i = 0; i < gridData.length; i++) {
    var grade = 0;
    grade = gridData[i].grade;
    //격자 색 설정
    if (grade == 5) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[0]
      );
    } else if (grade == 4) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[1]
      );
    } else if (grade == 3) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[2]
      );
    } else if (grade == 2) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[3]
      );
    } else if (grade == 1) {
      grid.SetGridCellColor(
        gridData[i].index_y,
        gridData[i].index_x,
        gridCellColor[4]
      );
    }
    // 셀 높이 설정
    grid.SetGridCellHeight(
      gridData[i].index_y,
      gridData[i].index_x,
      gridData[i].result * 10000
    );
    //격자 외곽라인 색 설정
    grid.SetGridCellLineColor(
      gridData[i].index_y,
      gridData[i].index_x,
      new Module.JSColor(150, 0, 0, 0)
    );
  }

  // 설정한 옵션으로 그리드 객체 형태 생성
  grid.Create();

  return grid;
}

/**실습 11. 분석기능
 * - 1) 시곡면 분석
 */
function addAnalysisBuilding(val) {
  Module.XDSetMouseState(1); //지도 이동 모드
  if (val) {
    Module.XDEMapCreateLayer(
      "facility_build",
      "https://xdworld.vworld.kr",
      0,
      true,
      true,
      false,
      9,
      0,
      15
    ); //vworld 건물 레이어 생성
    Module.setVisibleRange("facility_build", 3.0, 100000.0);
    Module.map.setSimpleMode(false);
  } else {
    Module.XDEMapRemoveLayer("facility_build"); //vworld 건물 레이어 삭제
  }
}

function setMouseAnlaysis(val) {
  if (val) {
    Module.XDSetMouseState(21); //마우스 라인입력모드
  } else {
    Module.XDSetMouseState(1); //마우스 지도이동모드
  }
}

//시곡면 분석
function getSlopePlane(angle) {
  Module.getSlope().clearAnalysisData();
  Module.map.clearSelectObj(); //선택된 객체 해제
  Module.getUserLayer().removeAll(); //시곡면 삭제

  if (angle == null) {
    angle = Number($("#slopeRange").val());
  } else {
    angle *= 1;
  }

  var color = new Module.createColor(); // 시곡면 분석 색상 지정
  color.setARGB(180, 255, 0, 0);
  GLOBAL.Analysis.createSlopePlane(angle, color); // 시곡면 분석 퍼짐 각도, 색상 설정
}

//시곡면 분석 clear
function clearSlopePlane() {
  Module.getSlope().clearAnalysisData();
  Module.map.clearSelectObj(); // 선택된 객체 해제
  Module.getUserLayer().removeAll(); // 시곡면 삭제
  Module.XDClearInputPoint();
  Module.XDRenderData();
}

var vFlag = false;
function viewFireE(e) {
  var pAnal = GLOBAL.Analysis;
  pAnal.setVFCreateClickMode(false); // 건물이 선택되면 이후 클릭에서 가시권 인식을 안한다.
  Module.map.clearSelectObj(); // 건물 선택에 대한 효과 제거
  Module.map.MapRender(); // 화면 랜더링 갱신
}

/**실습 11. 분석기능
 * - 2) 가시권 분석
 */
function setViewshadeMode(val) {
  Module.XDSetMouseState(1);
  Module.map.clearInputPoint();

  var voEl = document.getElementsByClassName("viewOptions");
  GLOBAL.Analysis.setVFMode(val); // 가시권 3D 표현 여부 설정
  GLOBAL.Analysis.setVFCreateClickMode(val); // 마우스 클릭시 가시권 인식 설정
  if (val) {
    Module.canvas.addEventListener("Fire_EventSelectedObject", viewFireE); //객체 선택 이벤트
    for (var i = 0; i < voEl.length; i++) {
      //가시권 속성 조절 바 이벤트
      voEl[i].onmousedown = function (e) {
        vFlag = true;
      };
      voEl[i].onmousemove = function (e) {
        if (vFlag) {
          var optionVal = this.value;
          var optionId = this.id;
          setViewOption(optionVal, optionId);
        }
      };
      voEl[i].onmouseup = function (e) {
        vFlag = false;
      };
    }
  } else {
    Module.map.clearSelectObj();
    for (var i = 0; i < voEl.length; i++) {
      voEl[i].onmousedown = "return false;";
      voEl[i].onmousemove = "return false;";
      voEl[i].onmouseup = "return false;";
    }
    Module.canvas.removeEventListener("Fire_EventSelectedObject", viewFireE);
  }
}

//가시권 분석 범위 조절
function setViewOption(val, id) {
  var pAnal = GLOBAL.Analysis;
  var vfov2D = pAnal.getVFFov();
  switch (id) {
    case "viewPan":
      pAnal.setVFPan(parseInt(val));
      break;
    case "viewTilt":
      pAnal.setVFTilt(parseInt(val));
      break;
    case "viewFovX":
      vfov2D.x = parseFloat(val);
      pAnal.setVFFov(vfov2D);
      break;
    case "viewFovY":
      vfov2D.y = parseFloat(val);
      pAnal.setVFFov(vfov2D);
      break;
    case "viewDist":
      pAnal.setVFDistance(parseInt(val));
      break;
  }
}
