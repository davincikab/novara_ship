import { useEffect, useRef, useState } from 'react'

import './App.css';
import SketchfabViewer from './SketchfabViewer';
import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiCloseLine, RiExpandDiagonal2Line, RiExpandDiagonalLine } from '@remixicon/react';
import { FilterMatchMode } from 'primereact/api';

import Draggable from 'react-draggable';

import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';

import { playSound } from './utils';
import { camHO, camLD, camLH, camMD, camReset, camSA, camUD, gaHO, gaLD, gaLH, gaMainDock, gaSails, gaUD } from './annotations/annotations';
import { Slider } from 'primereact/slider';
import Icons from './Icons';
import LanguageDiv from './LanguageDiv';
import { useLocalization, useTranslation } from './LocalizationProvider';
import Logo from './Logo';
import useDeviceDetection from './hooks/useDeviceDetection';
import ListingTab from './components/ListingTab';

const part0 = 99; //  vele_alberi_corde
const part1 = 248; //  piano1 1050, 1115, 315
const part2 = 2619; //  piano_2 1172
const part3 = 8131; //  piano_3 7551
const part4 = 11817; //  piano_4 2053
const part5 = 12571; // piano_scafo_inferiore  


const boatSections = {
  'sails': { floor: 0, cam: camSA, part: part0, annotations: gaSails, name: "Sails" },
  'mainDeck': { floor: 1, cam: camMD, part: part1, annotations: gaMainDock, name: "Main Deck" },
  'upperDeck': { floor: 2, cam: camUD, part: part2, annotations: gaUD, name: "Upper Deck" },
  'lowerDeck': { floor: 3, cam: camLD, part: part3, annotations: gaLD, name: "Lower Deck" },
  'hold': { floor: 4, cam: camHO, part: part4, annotations: gaHO, name: "Hold" },
  'lowerHold': { floor: 5, cam: camLH, part: part5, annotations: gaLH, name: "Lower Hold" }
};

window.BoatSections = boatSections;

// 
function App() {
  let api;

  const levelsRef = useRef(null);
  const navRef = useRef(null);
  const t = useTranslation();
  const device = useDeviceDetection();
  const { language } = useLocalization()

  // const { position, handleMouseDown } = useDrag({
  //   ref: draggableRef
  // });

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [activeDeck, setActiveDeck] = useState("");
  const [fullMode, setFullMode] = useState(true);
  const [expandedRows, setExpandedRows] = useState(null);
 
  const [showMedia, setShowMedia] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotationsLinks, setAnnotationsLinks] = useState([]);
  const [isDetailTabOpen, setIsDetailTabOpen] = useState(false);
  const [isNavActive, setisNavActive] = useState(false);

  const [state, setState] = useState({
    annotations: [],
    annotationCount: [],
    parts: 5,
    partsRange: [0, 5],
    isTableOpen: false,
    isModelControlExpanded: false,
    isViewOptionExpanded: false
  })

  const getAnnotationsLinks = async () => {
    try {
      let response = await fetch("https://globalsearoutes.net/wp-json/wp/v2/annotazioni?per_page=99").then(res => res.json());
      // console.log(response);
      setAnnotationsLinks(response);
    } catch (error) {
      // console.log(error);
    }
  }

  useEffect(() => {
    if (!annotationsLinks.length) {
      getAnnotationsLinks();
    }
  });


  const onsuccess = (apiClient) => {
    // console.log("Success");
    api = apiClient;
    window.apiClient = apiClient;

    window.apiClient.load();
    window.apiClient.start();

    window.apiClient.addEventListener("viewerready", () => {
      // console.log("View Ready");
      // document.getElementById("panel").classList.remove("hidden");
      window.apiClient.getSceneGraph((err, graph) => {
        if (err) {
          // console.log("Error getting nodes");
          return;
        }



        window.nodeMap = {};

        // Funzione ricorsiva per costruire la mappa dei nodi

        function stampaGerarchia(node, livello = 0) {
          //  console.log(`${indent}- ${node.name || '(senza nome)'} [ID: ${node.instanceID}]`);

          // Salva il nodo nella mappa
          window.nodeMap[node.instanceID] = {
            ...node,
            parent: node.parent // parent può essere undefined qui
          };

          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              child.parent = node; // assegna il parent manualmente
              stampaGerarchia(child, livello + 1);
            });
          }
        }

        stampaGerarchia(graph);

        // get the id from that log
        window.apiClient.load(() => {
          // window.console.log("Viewer loaded");
          playSound();
          enableUIClick();
        });

        // Eventi per le animazioni
        window.apiClient.addEventListener("animationEnded", () => {
          // window.console.log("Animation ended");
          // riabilitaButton();
        });

        window.apiClient.addEventListener("animationPlay", () => {
          // window.console.log("Animation play");
          // disabilitaButton();
        });


        //PATCH che nasconde refusi del modello
        window.apiClient.hide(13561); //lampada nell'lowerHold

        // EVENTI PER LE ANNOTAZIONI
        window.apiClient.getAnnotationList(function (err, annotations) {
          if (!err) {

            setState((prevState) => ({
              ...prevState,
              annotationsList: annotations,
              annotationCount: annotations.length
            }))

            // console.log(annotations);
          }
        });

        window.apiClient.addEventListener("annotationSelect", function (info) {
          // console.log('annotationSelect', info);
          if (info === -1) {
            return;
          }

          focusToAnnotation(info);
        });

        window.apiClient.addEventListener("annotationFocus", () => {

        });

        window.apiClient.addEventListener("annotationBlur", function () {
          //console.log('annotationBlur', info, annotationsList[info]);
        });

        window.apiClient.addEventListener("click", (info) => {
          // console.log(info);
          if (!info || !info.instanceID) return;
          handleSectionClick(info);
        });

      });
    });
  }


  const onerror = () => {

  };

  const enableUIClick = () => {
    setisNavActive(true);
  }

  const handleSectionClick = (info) => {
    console.log(info);

    // return;
    const gruppiPrincipali = {
      "99": "sails",
      "248": "mainDeck",
      "2619": "upperDeck",
      "8131": "lowerDeck",
      "11817": "hold",
      "12571": "lowerHold"
    };

    let currentNode = nodeMap[info.instanceID];

    // Cerca risalendo la gerarchia il maxi-gruppo
    while (currentNode) {
      const id = currentNode.instanceID.toString();
      if (gruppiPrincipali[id]) {
        // console.log(`You clicked on: ${gruppiPrincipali[id]}`);
        //console.log(`Gruppo trovato: ${gruppiPrincipali[id]}`);

        onClick({ target: { id: gruppiPrincipali[id] } });
        return;
      }
      currentNode = currentNode.parent;
    }
  }

  const focusToAnnotation = (index) => {
    setExpandedRows({ [parseInt(index + 1)]: true });
    // setState({ ...state, isTableOpen: true });
    setIsDetailTabOpen(true);
    setState(prevState => ({ ...prevState, isTableOpen: true, annotations: [...window.annotations], annotationCount: window.annotations.lenght }));
    
  }

  const handleHorizontalScroll = (element, step) => {
    let scrollAmount = 0, speed = 25, distance=120;
    // let element = navRef.current;

    if(!element) {
      return;
    }

    const slideTimer = setInterval(() => {
      element.scrollLeft += step;
      scrollAmount += Math.abs(step);
      if (scrollAmount >= distance) {
        clearInterval(slideTimer);
      }
    }, speed);

  }

  const onClick = (e) => {
    let { id } = e.target;
    // console.log("Click:", id, fullMode);
    // console.log(window.apiClient);
    if (!window.apiClient) {
      return;
    }

    setIsDetailTabOpen(false);
    setExpandedRows(null);

    let { cam, part, annotations, floor } = window.BoatSections[id];

    if(device == "Mobile") {
      let step = activeDeck ? boatSections[activeDeck].floor > floor ? -20 : 20 : 20;
      step = floor ? step : step * 1.5;
      // * (floor || 1)
      handleHorizontalScroll(navRef.current, step  );
    }

    // if(fullMode) {

    nascondiTutto();
    if (activeDeck == id) {
      setActiveDeck("");
      resetCam();
      removeAnnotations();
      
      setState(prevState => ({ ...prevState,isTableOpen:false, annotations: [], annotationCount: 0 }));

    } else {
      window.apiClient.seekTo(4.12);
      if (!fullMode) {
        // console.log("Part:", floor);
        nascondiTutto();
        mostraSoloParte(part);
      } else {
        mostraTutto();
      }

      // return;
      removeAnnotations();
      window.apiClient.setCameraLookAt(cam.eye, cam.target);
      window.annotations = [...annotations.map((entry, i) => ({ ...entry, id: i + 1 }))];
      window.activeDeck = id;

      setState(prevState => ({ ...prevState, annotations: [...annotations.map((entry, i) => ({ ...entry, id: i + 1 }))], annotationCount: 0 }));
      setSelectedAnnotation(null)
      setActiveDeck(id);
      setExpandedRows(null);
      setIsDetailTabOpen(false);


      createAnnotations(annotations);
    }

    // setActiveDeck(id);
  }

  const createAnnotations = (annotations) => {
    window.apiClient.removeAllAnnotations();

    for (let i in annotations) {
      window.apiClient.createAnnotationFromScenePosition(
        annotations[i].position,
        annotations[i].eye,
        annotations[i].target,
        annotations[i].name,
        annotations[i].content.rendered,
        function (err) {
          if (!err) {
            //console.log("Created new annotatation", index + 1);
          }
        }
      );
    }

    // window.apiClient.addEventListener("annotationSelect", (info) => {
    //   console.log('annotationSelect', info);
    //   if (info === -1) {
    //     return;
    //   }
    //   // console.log('annotationSelect', info);

    //   setExpandedRows(annotations[info]);
    //   //playSound();
    //   //console.log(annotationsList[info].name + (annotationsList[info].content ? annotationsList[info].content.rendered : ''));
    // });

  }

  const removeAnnotations = () => {
    window.apiClient.removeAllAnnotations(
      function (err) {
        // console.log(err);
        if (!err) {
          // window.apiClient.removeAllAnnotations();
          //audio.play();
        }

      });

      // setTi
  }

  const resetCam = () => {
    window.apiClient.setCameraLookAt(camReset.eye, camReset.target);
  }

  const floors = Object.values(boatSections);
  function mostraTutto() {
    for (let a = 0; a < floors.length; a++) {
      window.apiClient.show(floors[a].part);
    }
  }
  function mostraSoloParte(parte) {
    console.log("show single floor:", parte);
    window.apiClient.show(parte);
  }

  function nascondiTutto() {
    for (let a = 0; a < floors.length; a++) {
      window.apiClient.hide(floors[a].part);
    }
  }


  useEffect(() => {
    if (window.apiClient) {
      fullMode ? mostraTutto() : "";
      if (!fullMode && activeDeck) {
        nascondiTutto();
        mostraSoloParte(boatSections[activeDeck].part);
      }

    }
  }, [fullMode, activeDeck]);

  const getIcon = (section, size = 18) => {
    return <Icons name={section} size={size} is_active={section == activeDeck} />
  }


  const onLevelsChange = (e) => {
    removeAnnotations();
    setState({ ...state, annotationCount: 0, annotations: [] })
    setActiveDeck("");

    setState((prevState) => ({ ...prevState, parts: e.value }));

    if (e.animate) {
      let { value } = e;
      value == 5 ? openModel() : closeModel();
    } else {
      window.apiClient.seekTo(e.value);
    }
  }

  const onRangeChange = (e) => {
    setState({ ...state, partsRange: e.value });
  }

  const openModel = () => {
    window.apiClient.seekTo(0);
    // Ottiene l'ID dell'animazione dal nome
    window.apiClient.getAnimations((err) => {
      if (err) {
        console.error(err);
        return;
      }

      // Imposta l'animazione in loop
      window.apiClient.setSpeed(1);
      window.apiClient.play();
    });
  }

  const closeModel = () => {
    window.apiClient.seekTo(4.13);
    window.apiClient.getAnimations((err) => {
      if (err) {
        console.error(err);
        return;
      }
      // Imposta l'animazione in loop
      window.apiClient.setSpeed(-1);
      // Imposta la velocità di riproduzione negativa
      // Riproduce l'animazione
      window.apiClient.play();
    });

    resetCam();
  }

  const gotoAnnotation = (annotation) => {
    window.apiClient.gotoAnnotation(annotation.id - 1, function (err) {});
  }

  const toggleTable = (e) => {
    e ? e.stopPropagation() : "";
    if(!state.isTableOpen) {

      // setTimeout(() => {
        setExpandedRows(null);
        setIsDetailTabOpen(false);
      // }, 1000);
      
    }

    setState({ ...state, isTableOpen: !state.isTableOpen });
  }

  const toggleMediaSection = (e) => {
    e.stopPropagation();
    setShowMedia(!showMedia);
  }

  const resetViewer = () => {
    setActiveDeck(null);
    setState({ ...state, annotations: [] })
  }

  const modelUid = "03264464875242bda7e9c07da6921df8";

//  console.log(navRef.current);
// console.log(expandedRows, isDetailTabOpen);
  return (
    <div className='w-full h-full !bg-[#e7e7e7] main-section relative'>
      { isNavActive && <div className="navbar mb items-center flex absolute gap-3 z-[10] p-4 w-full h-[60px] top-3">
          <div 
            // ref={navRef}
            className="flex scrollbar-thin 
                    scrollbar-thumb-gray-400 
                    scrollbar-track-transparent 
                    flex-nowrap overflow-x-scroll 
                    no-scrollbar
                    space-x-2 gap-x-[12px] text-[#403F43]  bg-[#ffffffb0] p-2 px-4 rounded-2xl w-fit lg:max-w-[1100px] backdrop-blur-2xl mx-auto z-[10]"
          >
              {
                Object.keys(boatSections).map(sectionId => {
                  return (
                    <Button
                      key={sectionId}
                      onClick={onClick}
                      className={`nav-btn ${activeDeck == sectionId ? "!bg-[#403F43] !text-white active" : ""}`}
                      // className={`min-w-[100px] !text-[16px] !text-[#000] !py-[1px] !px-[24px] !h-[48px] flex justify-evenly !border-[0.5px] !border-[#CDCDDF] !text-[#403F43] rounded-full ${activeDeck == sectionId ? "!bg-[#403F43] !text-white" : "!bg-[#e8e8e8]"}`} 
                      id={sectionId}
                      rounded
                      // disabled={isNavActive ? false : true}
                    >
                      {/* ICONE TOP BUTTONS            
                <span className="mx-1 pointer-events-none scale-[0.8]">{getIcon(sectionId)}</span> */}
                      <div className='w-full'>{t(sectionId) || boatSections[sectionId].name}</div>
                    </Button>
                  )
                })
              }
              <Logo />

            </div> 
          <LanguageDiv />
      </div> }

      {// BUTTON PANEL ANNOTATION 
          (activeDeck && !state.isTableOpen) ?
            <Button onClick={toggleTable} className='!absolute z-[10] bottom-[20px] right-4  flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 !rounded-full' rounded>
          <RiArrowLeftDoubleLine color='#403F43' className='!font-bold' size={28} />
        </Button> : ""}

      <div className="main w-full absolute !bg-[transparent] overflow-hidden z-0" style={{ top: "0px", left: "0px", bottom: "0px", right: "0px", border: "10px solid #e7e7e7" }}>
        <div className="w-full h-12 z-4 !bg-[#e7e7e7] absolute top-[0px] left-0 flex items-center !bg-bla hidden">

          <div className=" bg-[bla] p-2 flex items-center z-[10]">
            <Button onClick={resetViewer} className='!bg-[#f1f1f1] border-[0.5px] !border-[#CDCDDF] h-[40px] w-[40px] backrop-blur-[30px] !p-1 flex items-center justify-center rounded-full' rounded>
              <RiArrowLeftSLine size={30} color='' />
            </Button>

            <div className='flex flex-col !mx-4 title-section'>
              <h5 className="font-bold text-[22px] text-[#403F43] my-0">Novara</h5>
              <div className='text-[#5D6C71] text-[14px] my-0 capitalize'> {activeDeck ? boatSections[activeDeck].name : ""}</div>
            </div>
          </div>

          <div className="flex gap-x-[12px] text-[#403F43] mx-auto">

            {
              Object.keys(boatSections).map(sectionId => {
                return (
                  <Button
                    key={sectionId}
                    onClick={onClick}
                    className={`nav-btn ${activeDeck == sectionId ? "!bg-[#403F43] !text-white active" : ""}`}
                    // className={`min-w-[100px] !text-[16px] !text-[#000] !py-[1px] !px-[24px] !h-[48px] flex justify-evenly !border-[0.5px] !border-[#CDCDDF] !text-[#403F43] rounded-full ${activeDeck == sectionId ? "!bg-[#403F43] !text-white" : "!bg-[#e8e8e8]"}`} 
                    id={sectionId}
                    rounded
                  >
                    <span className="mx-0 pointer-events-none scale-[0.8]">{getIcon(sectionId)}</span>
                    <div>{boatSections[sectionId].name}</div>
                  </Button>
                )
              })
            }
          </div>

          <div className="bg-black/0 w-20 h-full"></div>
        </div>

     

        {showMedia ? <div className="!absolute z-[10] top-[85px] left-2 !bg-[#e7e7e7] media-section w-[400px] shadow-md rounded-[8px] max-h-[85%] overflow-y-auto">
          <div className="h-16 relative">
            <Button onClick={toggleMediaSection} className='!absolute z-[10] top-[8px] right-2 flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 !rounded-full' rounded>
              <RiCloseLine color='#403F43' className='!font-bold' size={24} />
            </Button>
          </div>

          <div className="media-list p-[10px]">
            {state.annotations.filter(item => (item.note || item.noteIta)).map(item => {
              return (
                <div className='block bg-[#e7e7e7] p-4 mb-2 border-[1px] border-[#d9d9d9] rounded-lg text-[#403F43]'>
                  <div className="mb-3 text-[15px] ">{item.name}</div>

                  {item.note ? <video src={item.note} controls></video> : ""}
                  {item.noteIta ? <div className="my-2 flex flex-col">
                    <div className="mt-2 text-[12px]">Audio</div>
                    <audio controls>
                      <source src={item.noteIta} type="audio/mp3"></source>
                    </audio>
                  </div>
                    : ""
                  }
                </div>
              )
            })}
          </div>
        </div> : ""}

        { //PANEL ANNOTATION DRAGGABLE
          activeDeck &&
          <ListingTab 
            boatSections={boatSections}
            annotations={state.annotations}
            annotationCount={state.annotationCount}
            setState={setState}
            setExpandedRows={setExpandedRows}
            setActiveDeck={setActiveDeck}
            setSelectedAnnotation={(annotatation) => gotoAnnotation(annotatation)}
            setShowMedia={setShowMedia}
            activeDeck={activeDeck}
            expandedRows={expandedRows}
            language={language}
            annotationsLinks={annotationsLinks}
            setFullMode={setFullMode}
            fullMode={fullMode}
            isTableOpen={state.isTableOpen}
            toggleTable={toggleTable}

            openDetailTab={isDetailTabOpen}
          />
        }

        <div className="w-full bg-[#e7e7e7] shadow-none border-[0px] rounded-md relative z-0">
          {/*    <div className="h-12 absolute !bg-[#e7e7e7] w-full"></div> */}
          <div className="relative w-full md:h-[calc(100svh+100px)] h-[calc(100vh-60px)] bg-red-100 !z-0 pointer-events-all">
            <SketchfabViewer modelUid={modelUid} success={onsuccess} error={onerror} />
          </div>


          {/* <Button label='Close' onClick={() => {onLevelsChange({value:0, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' /> */}

          {
            // PANEL livelli
          }

          <Draggable handle='strong' bounds="body" nodeRef={levelsRef}>
            <div ref={levelsRef} className="bg-[#e8e8e8] rounded-md !w-[400px] md:block hidden p-2 z-[15] flex flex-col justify-between w-full h-auto absolute left-2 bottom-2">
              <div className="slider-section my-2 mb-3 w-[95%] mx-auto">
                <strong htmlFor="" className='mb-2 w-full my-2'>
                  <div className="my-2 w-full">{t('levels')}</div>
                </strong>
                <Slider value={state.parts} onChange={onLevelsChange} max={5} min={0} step={0.1} className='focus:!bg-[#AD9A6D] ' />
              </div>

              <div className="flex justify-between mt-3">
                <Button label={t('close')} onClick={() => { onLevelsChange({ value: 0, animate: true }) }} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
                <Button label={t('open')} onClick={() => { onLevelsChange({ value: 5, animate: true }) }} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
              </div>
            </div>
          </Draggable>


          <div className=" bg-[bla] p-2 flex items-center z-[10] absolute md:bottom-[130px]  hidden">
            <Button onClick={resetViewer} className='!bg-[#f1f1f1] border-[0.5px] !border-[#CDCDDF] h-[40px] w-[40px] backrop-blur-[30px] !p-1 flex items-center justify-center rounded-full' rounded>
              <RiArrowLeftSLine size={30} color='' />
            </Button>

            <div className='flex flex-col !mx-4 title-section'>
              <h5 className="font-bold text-[22px] text-[#403F43] my-0">Novara</h5>
              <div className='text-[#5D6C71] text-[14px] my-0 capitalize'> {activeDeck ? t(activeDeck) : ""}</div>
            </div>
          </div>

        </div>

        <div className="absolute bottom-0 left-0 flex items-end w-auto !py-4 hidden">
          <div className="bg-[#e8e8e8] shadow-md h-[fit-content] w-[400px] !mr-4 p-[20px] rounded-md">
            <div className="header flex justify-between w-full text-black mb-2">
              <div className="title-section">
                <h5 className="font-bold text-[22px] text-[#403F43]">Model Controls</h5>
                <div className='text-[#5D6C71] text-[16px] my-1'>Manage the 3D Model View</div>
              </div>

              <Button
                onClick={() => setState({ ...state, isModelControlExpanded: !state.isModelControlExpanded })}
                className='!bg-[#f1f1f1] border-[1px] !border-[#CDCDDF] h-[40px] w-[40px] !p-1 flex items-center justify-center rounded-full'
              >
                <RiExpandDiagonalLine size={19} />
                <RiExpandDiagonal2Line size={19} className='absolute' />
              </Button>
            </div>

            {
              state.isModelControlExpanded ?
                <>
                  <hr className='!bg-[#878787] border-[#878787] ' />
                  <div className="body py-2 flex flex-col justify-between w-full h-auto">
                    <div className="slider-section my-2 mb-3 w-[95%] mx-auto">
                      <Slider value={state.parts} onChange={onLevelsChange} max={5} min={0} step={0.1} className='focus:!bg-[#AD9A6D] ' />
                    </div>

                    <div className="flex justify-between mt-3">
                      <Button label='Close' onClick={() => { onLevelsChange({ value: 0, animate: true }) }} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
                      <Button label='Open' onClick={() => { onLevelsChange({ value: 5, animate: true }) }} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
                    </div>

                  </div></>
                : ""
            }
          </div>


          <div className="bg-[#e8e8e8] shadow-md w-[400px] !p-[20px] rounded-md h-[fit-content] hidden">

            <div className="header flex justify-between w-full text-black mb-2">
              <div className="title-section">
                <h5 className="font-bold text-[22px] text-[#403F43]">View Options</h5>
                <div className='text-[#5D6C71] text-[16px] my-1'>Customize Deck Visibility</div>
              </div>

              <Button
                className='!bg-[#f1f1f1] border-[1px] !border-[#CDCDDF] h-[40px] w-[40px] !p-1 flex items-center justify-center rounded-full'
                rounded
                onClick={() => setState({ ...state, isViewOptionExpanded: !state.isViewOptionExpanded })}
              >
                <RiExpandDiagonalLine size={19} />
                <RiExpandDiagonal2Line size={19} className='absolute' />
              </Button>
            </div>

            {
              state.isViewOptionExpanded ?
                <>
                  <hr className='!bg-[#878787] border-[#878787] ' />

                  <div className="body py-2 ">
                    <div className="flex w-full items-center justify-center my-2 mb-4">
                      <ButtonGroup>
                        <Button onClick={() => setFullMode(true)} label="Full" className={"!rounded-l-xl !border-[#AD9A6D] h-[35px] w-[110px] " + (fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
                        <Button onClick={() => setFullMode(false)} label="Single" className={"!rounded-r-xl !border-[#AD9A6D] h-[35px]  w-[110px] " + (!fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
                      </ButtonGroup>
                    </div>

                    <Slider range min={0} max={5} step={0.1} value={state.partsRange} onChange={onRangeChange} />

                  </div>
                </>
                : ""
            }

          </div>
        </div>

      </div>
    </div>
  )
}

export default App;

/*
  - Next/Prev button on listing/detail tab

*/