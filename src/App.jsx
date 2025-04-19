import { useEffect, useRef, useState } from 'react'

import './App.css';
import SketchfabViewer from './SketchfabViewer';
import { RiLock2Line, RiDraggable, RiArrowLeftDoubleLine, RiArrowLeftSLine, RiGalleryLine, RiCloseLine, RiExpandDiagonal2Line, RiExpandDiagonalLine, RiHome2Line, RiHome3Line, RiHome4Line, RiSailboatFill, RiSailboatLine, RiSearch2Line, RiTriangleLine } from '@remixicon/react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';

import Draggable from 'react-draggable';

import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

import { playSound } from './utils';
import { camHO, camLD, camLH, camMD, camReset, camSA, camUD, gaHO, gaLD, gaLH, gaMainDock, gaSails, gaUD } from './annotations/annotations';
import { InputText } from 'primereact/inputtext';
import { Slider } from 'primereact/slider';
import { useDrag } from './useDrag';
import Icons from './Icons';
import { ResizableBox } from 'react-resizable';
import LanguageDiv from './LanguageDiv';
import { useLocalization, useTranslation } from './LocalizationProvider';
import Logo from './Logo';

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


// const iSails = new NovaraParts("sails", part0, camSA);
// const iMainDeck = new NovaraParts("mainDeck", part1, camMD);
// const iUpperDeck = new NovaraParts("upperDeck", part2, camUD);
// const iLowerDeck = new NovaraParts("lowerDeck", part3, camLD);

// const iHold = new NovaraParts("hold", part4, camHO);
// const iLowerHold = new NovaraParts("lowerHold", part5, camLH);
// const floors = [iSails, iMainDeck, iUpperDeck, iLowerDeck, iHold, iLowerHold];

// 
function App() {
  let api;

  const draggableRef = useRef(null);
  const levelsRef = useRef(null);
  const t = useTranslation();
  const { language } = useLocalization()

  // const { position, handleMouseDown } = useDrag({
  //   ref: draggableRef
  // });

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState('');

  // const [openModal, setOpenModal] = useState(0);

  const [activeDeck, setActiveDeck] = useState("");
  const [fullMode, setFullMode] = useState(true);
  const [expandedRows, setExpandedRows] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(true);
  const [lockedAnnotations, setLockedAnnotations] = useState([]);
  const [showMedia, setShowMedia] = useState(false);
  const [annotationsLinks, setAnnotationsLinks] = useState([]);
  const [isDetailTabOpen, setIsDetailTabOpen] = useState(false);

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
      let response = await fetch("https://globalsearoutes.net/wp-json/wp/v2/annotazioni").then(res => res.json());
      setAnnotationsLinks(response);
    } catch (error) {
      console.log(error);
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

    // console.log(api);

    window.apiClient.load();
    window.apiClient.start();

    window.apiClient.addEventListener("viewerready", () => {
      console.log("View Ready");
      // document.getElementById("panel").classList.remove("hidden");
      window.apiClient.getSceneGraph((err, graph) => {
        if (err) {
          console.log("Error getting nodes");
          return;
        }



        window.nodeMap = {};

        // Funzione ricorsiva per costruire la mappa dei nodi
        function buildNodeMap(node, parent = null) {
          window.nodeMap[node.instanceID] = { ...node, parent };
          if (node.children) {
            node.children.forEach(child => buildNodeMap(child, node));
          }
        }

        function stampaGerarchia(node, livello = 0) {
          const indent = '  '.repeat(livello);
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
          window.console.log("Viewer loaded");
          playSound();
        });

        // Eventi per le animazioni
        window.apiClient.addEventListener("animationEnded", () => {
          window.console.log("Animation ended");
          // riabilitaButton();
        });

        window.apiClient.addEventListener("animationPlay", () => {
          window.console.log("Animation play");
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
          console.log('annotationSelect', info);
          if (info === -1) {
            return;
          }

          focusToAnnotation(info);
          // console.log('annotationSelect', info);

          //playSound();
          //console.log(annotationsList[info].name + (annotationsList[info].content ? annotationsList[info].content.rendered : ''));
        });

        window.apiClient.addEventListener("annotationFocus", (info) => {

        });

        window.apiClient.addEventListener("annotationBlur", function (info) {
          //console.log('annotationBlur', info, annotationsList[info]);
        });

        window.apiClient.addEventListener("click", (info) => {
          console.log(info);
          if (!info || !info.instanceID) return;
          handleSectionClick(info);
        });

      });
    });
  }


  const onerror = () => {

  };

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
        console.log(`You clicked on: ${gruppiPrincipali[id]}`);
        //console.log(`Gruppo trovato: ${gruppiPrincipali[id]}`);

        onClick({ target: { id: gruppiPrincipali[id] } });
        return;
      }
      currentNode = currentNode.parent;
    }
  }

  const focusToAnnotation = (index) => {
    console.log('Active Deck:', window.activeDeck);

    console.log(window.annotations.find(item => item.id == index));
    setExpandedRows({ [parseInt(index + 1)]: true });
    setState({ ...state, isTableOpen: true });
    setState(prevState => ({ ...prevState, annotations: [...window.annotations], annotationCount: window.annotations.lenght }));
    setIsDetailTabOpen(true);
  }

  const onClick = (e) => {
    console.log(e);
    let { id } = e.target;
    // console.log("Click:", id, fullMode);
    // console.log(window.apiClient);
    if (!window.apiClient) {
      return;
    }

    console.log(window.BoatSections[id]);
    let { cam, part, annotations, floor } = window.BoatSections[id];

    // if(fullMode) {

    nascondiTutto();
    if (activeDeck == id) {
      setActiveDeck("");
      resetCam();
      removeAnnotations();
      setState(prevState => ({ ...prevState, annotations: [], annotationCount: 0 }));

    } else {
      window.apiClient.seekTo(4.12);
      if (!fullMode) {
        console.log("Part:", floor);
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
        function (err, index) {
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

          //audio.play();
        }

      });
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

  const onSelectionChange = (e) => {
    console.log(e);
    if (!e.value) {
      return;
    }

    setSelectedAnnotation(e.value);

    let annotationIndex = state.annotations.findIndex(annotation => annotation.id == e.value.id);
    window.apiClient.gotoAnnotation(annotationIndex);
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

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };

    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

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
    window.apiClient.getAnimations((err, data) => {
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
    window.apiClient.getAnimations((err, data) => {
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

  const toggleTable = () => {
    setState({ ...state, isTableOpen: !state.isTableOpen })
  }

  const closeDetailTab = () => {
    setIsDetailTabOpen(false);

    setTimeout(() => {
      setExpandedRows(null);
    }, 500);

  }

  const renderHeader = () => {
    return (
      <section className=" cursor cursor-move handle flex justify-between !text-[#403F43] flex-col h-full overflow-hidden relative">
        <div className="py-3 text-[#403F43] font-bold text-[18px] flex items-center bg-lack">
          <div className="flex-1 flex items-center">
            <span className="mx-2 hidden"><Icons name={activeDeck} is_active={false} /> </span>
            {/*               {t(activeDeck)}  TESTO PONTE */}
          </div>

          <div className='flex-1 bg-red-00'>
            <RiDraggable className='rotate-[90deg]' size={32} />
          </div>

          <div className="w-[40px] h-[40px]">

          </div>

          <Button
            onClick={toggleTable}
            className={`close-btn !absolute ${expandedRows ? `top-[12px] right-[0px]` : "top-[12px] right-[0px]"} !h-[40px] !w-[40px] !p-0 flex items-center justify-center !z-12 !border-[2px]`}

          >
            <RiCloseLine color='#403F43' className='!font-bold text-2xl' size={24} />
          </Button>


        </div>

        {/* <strong className="cursor cursor-move w-full h-[80px] bg-[orange] handle absolute z-2" > 
              </strong>  */}


        {false && (
        <div className='w-full flex items-center justify-center'>
          {/* <IconField iconPosition="left" className='flex-1'>
                <RiSearch2Line className='top-[10px] left-2 absolute !text-[#7B838A]' size={20} />
                <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Search by ID, name " className='w-full h-10 !text-[13px] !rounded-[5px]' />
            </IconField> */}
 
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => setFullMode(true)} label={t("full")} className={"  !text-[12px] !rounded-full !border-[#AD9A6D] h-[30px] w-[70px] " + (fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
            <Button onClick={() => setFullMode(false)} label={t("single")} className={"  !text-[12px] !rounded-full !border-[#AD9A6D] h-[30px]  w-[70px] " + (!fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
          </div>
        </div>
        )}

        
      </section>
    );
  };

  const lockTemplate = (rowData, options) => {
    const icon = options.frozenRow ? <RiLock2Line /> : <RiCloseLine />
    const disabled = options.frozenRow ? false : state.annotations.length >= 2;
    console.log(disabled);

    return <Button type="button" className="p-button-sm p-button-text" onClick={(e) => { e.stopPropagation(); toggleLock(rowData, options.frozenRow, options.rowIndex) }} >
      {icon}
    </Button>;
  };

  const toggleLock = (data, frozen, index) => {
    // console.log(data, index, frozen);

    let _lockedAnnotations, _unlockedAnnotations;

    if (frozen) {
      _lockedAnnotations = lockedAnnotations.filter((c, i) => i !== index);
      _unlockedAnnotations = [...state.annotations, data];
    } else {
      _unlockedAnnotations = state.annotations.filter((c, i) => i !== index);
      _lockedAnnotations = [...lockedAnnotations, data];
    }

    _unlockedAnnotations.sort((val1, val2) => {
      return val1.id < val2.id ? -1 : 1;
    });

    setLockedAnnotations(_lockedAnnotations);
    setState({ ...state, annotations: _unlockedAnnotations });
  };


  const rowExpansionTemplate = (data) => {
    console.log(data);
    console.log("Expansion Section");

    if (!data) {
      return;
    }

    return (<RowExpansionTemplate
      data={{ ...data }}
      annotationsLinks={annotationsLinks.filter(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.`))}
      language={language}
    />)
  }

  const allowExpansion = (rowData) => {
    return rowData[0].content;
  };

  const toggleMediaSection = (e) => {
    e.stopPropagation();
    setShowMedia(!showMedia);
  }

  const resetViewer = () => {
    setActiveDeck(null);
    setState({ ...state, annotations: [] })
  }

  const modelUid = "03264464875242bda7e9c07da6921df8";

  return (
    <div className='w-full h-full !bg-[#e7e7e7] main-section'>
      <div className="navbar mb items-center flex absolute gap-3 z-[10] p-4 w-full h-[60px] top-3">


      <div className="flex scrollbar-thin 
                scrollbar-thumb-gray-400 
                scrollbar-track-transparent 
                flex-nowrap overflow-x-scroll 
                space-x-2 gap-x-[12px] text-[#403F43]  bg-[#ffffffb0] p-2 px-4 rounded-2xl w-fit lg:max-w-[1100px] backdrop-blur-2xl mx-auto z-[10]">
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
      </div>

      <div className="main w-full absolute !bg-[transparent] overflow-hidden" style={{ top: "0px", left: "0px", bottom: "0px", right: "0px", border: "10px solid #e7e7e7" }}>
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

        {/*      { (state.annotations.length && !showMedia) ? <Button onClick={toggleMediaSection} className='!absolute z-[10] top-[60px] left-2 flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[48px] w-[48px] !p-1 !rounded-full' rounded>
                <RiGalleryLine color='#403f43' className='!font-bold' size={24} />
            </Button> : '' } */}

        {showMedia ? <div class="!absolute z-[10] top-[85px] left-2 !bg-[#e7e7e7] media-section w-[400px] shadow-md rounded-[8px] max-h-[85%] overflow-y-auto">
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


        {// BUTTON PANEL ANNOTATION 
          (activeDeck && !state.isTableOpen) ? <Button onClick={toggleTable} className='!absolute z-[10] bottom-[20px] right-4 flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 !rounded-full' rounded>
            <RiArrowLeftDoubleLine color='#403F43' className='!font-bold' size={28} />
          </Button> : ""}


        { //PANEL ANNOTATION DRAGGABLE
          (activeDeck && state.isTableOpen) &&
          <Draggable
            nodeRef={draggableRef}
            handle="section"
            bounds="body"
          >
            {/* <div ref={draggableRef} className="draggable-box relative bg-black"> */}



            <div
              ref={draggableRef}
              className="draggable-div !fixed z-[10] top-24 right-[10px] border-0 no-cursor">

              {/* <Button 
                  onClick={toggleTable} 
                  className={`close-btn !hidden !absolute ${expandedRows ? `top-[0px] right-[25px]` : "top-[15px] right-[10px]"} !h-[40px] !w-[40px] !p-0 flex items-center justify-center !z-12 !border-[2px]`}
                  // className='!absolute top-[20px] right-[20px] flex items-center justify-center !bg-[#CAC2B0]  !border-[#AD9A6D] h-[50px] w-[50px] !p-1 rounded-full' rounded
                >
                  <RiCloseLine color='#403F43' className='!font-bold text-2xl' size={24} />
                </Button> */}

              <ResizableBox
                className="box bg-red-0 w-full mt-[0px] no-cursor "
                width={380}
                height={690}
                minConstraints={[350, 400]}
                handleSize={[40, 40]}
                // maxConstraints={[540, 800]}
                style={{ maxWidth: "540px", maxHeight: "calc(100vh - 100px)", boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1),0px 10px 15px -3px rgba(0,0,0,0.1)" }}
                resizeHandles={["se", "sw"]}
                onResizeStop={() => console.log("Resize Stop")}
              >
                <div className="h-full overflow-hidden w-full mt-[0px] rounded-[16px]">

                  <div className="list-group w-full overflow-hidden relative bg-orange">

                    <DataTable
                      value={state.annotations.filter(item => !lockedAnnotations.find(annotation => annotation.id == item.id))}
                      selectionMode="single"
                      selection={selectedAnnotation}
                      onSelectionChange={onSelectionChange}
                      header={renderHeader()}
                      filters={filters}
                      // filterDisplay="row" 
                      //loading={loading}
                      globalFilterFields={['name',]}
                      //  expandedRows={expandedRows}
                      onRowToggle={(e) => { console.log(e); setExpandedRows(e.data); setIsDetailTabOpen(true); }}
                      // rowExpansionTemplate={() => (<div className="!h-0"><div>)}
                      dataKey="id"
                      className='cursor h-full'
                      tableStyle={{ minWidth: '20rem', background: "#efefef", height: "100%" }}
                      scrollable
                      showHeaders={false}
                      scrollHeight="86%"
                      frozenValue={lockedAnnotations}
                      style={{ background: "#efefef" }}
                    >
                      <Column field="id" header="ID" sortable style={{ textAlign: "center" }} ></Column>
                      <Column field="name" header="Annotation Name" sortable></Column>
                      <Column expander={allowExpansion} />

                      {/* <Column style={{ flex: '0 0 4rem' }} body={lockTemplate}></Column> */}
                    </DataTable>

                    { // ANNOTATION SCEDA INTERNA SECTION (quella che si apre con i detagli sull'annotation)
                      (state.annotations.length) ?
                        <div className={`sticky-section z-[10] h-[100%] overflowauto max-w-full w-full absolute top-[0px] transition-all duration-500 ease-in-out ${isDetailTabOpen ? 'left-0' : 'left-[100%]'} !bg-[#fff]`}>
                          {expandedRows && <>
                            <section class="handle cursor header-section p-3 sticky top-0 bg-[inherit] w-full z-2">
                              <div className='flex justify-between items-center w-[90%]'>

                                <div className='flex items-center flex-row-reverse mb-3 mt-3 w-full'>
                                  <div className='hidden'>{state.annotations[parseInt(Object.keys(expandedRows)[0]) - 1].name}</div>

                                  <div className='flex-1 flex justify-center'>
                                    <RiDraggable className='rotate-[90deg]' size={32} />
                                  </div>

                                  <Button
                                    onClick={(e) => closeDetailTab()}
                                    className="!bg-[#e7e7e7] !border-[#AD9A6D] !rounded-full !p-0 z-[25] flex items-center justify-center !left-0 !relative !h-[40px] !w-[40px] !border-[2px] !mr-2"
                                  // className='!absolute top-[20px] right-[20px] flex items-center justify-center  !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 rounded-full' rounded
                                  >
                                    <RiArrowLeftDoubleLine color='#403F43' className='!font-bold text-2xl' size={22} />
                                  </Button>
                                </div>
                              </div>
                            </section>

                            <div className="px-2 h-full z-0">
                              <RowExpansionTemplate
                                data={state.annotations[parseInt(Object.keys(expandedRows)[0]) - 1]}
                                annotationsLinks={annotationsLinks.filter(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.`))}
                                language={language}
                              />
                            </div>
                          </>}
                        </div> : ""}
                  </div>




                  {/* <div className="footer-section bg-white w-full !border-t-[1px] !border-[#CDCDDF] no-cursor">
                      <div className="flex items-center gap-x-[12px]">
                        {
                          Object.keys(boatSections).map(sectionId => {
                            return (
                              <Button 
                                key={sectionId}
                                onClick={onClick} 
                                className={`${activeDeck == sectionId ? "!bg-[#AD9A6D]/20 !text-white" : "!bg-[white]"}`}
                                // className={`flex items-center justify-center w-[50px] h-[40px] !py-[4px] !px-[4px] !border-[1px] !border-[#CDCDDF] !text-[#403F43] rounded-full ${activeDeck == sectionId ? "!bg-[#AD9A6D]/20 !text-white" : "!bg-[white]"}`} 
                                id={sectionId} 
                              >
                                <span className='scale-[0.9] pointer-events-none'><Icons name={sectionId} is_active={false} /> </span>
                                                           
                            </Button>
                            )
                          })
                        }
                      </div>
                  </div> */}
                </div>
              </ResizableBox >


            </div>

          </Draggable>
        }

        <div className="w-full bg-[#e7e7e7] shadow-none border-[0px] rounded-md relative">
          {/*    <div className="h-12 absolute !bg-[#e7e7e7] w-full"></div> */}
          <div className="w-full">
            <SketchfabViewer modelUid={modelUid} success={onsuccess} error={onerror} />
          </div>


          {/* <Button label='Close' onClick={() => {onLevelsChange({value:0, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' /> */}

          {
            // PANEL livelli
          }

          <Draggable handle='strong' bounds="body" nodeRef={levelsRef}>
            <div ref={levelsRef} className="bg-[#e8e8e8] rounded-md !w-[400px] p-2 z-[15] flex flex-col justify-between w-full h-auto absolute left-2 bottom-2">
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


          <div className=" bg-[bla] p-2 flex items-center z-[10] absolute bottom-[130px]  ">
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


const RowExpansionTemplate = ({ data, annotationsLinks, language }) => {
  // console.log(annotationsLinks);

  const [activeTab, setActiveTab] = useState("overview");
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef(null)

  const tabs = [
    { name: "Overview", id: 'overview' }, { name: "Audio & Video", id: "audio_video" },
    { name: "Technical Specs", id: 'technical_specs' }
  ];

  const onLoad = () => {
    // console.log("Iframe load");
    let turnOffLang = language == "en" ? "ita" : "eng";

    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      console.log(iframeDoc);

      iframeDoc.querySelectorAll(`.${turnOffLang}`).forEach(elem => {
        elem.style.display = "none";
      });
    }
    // console.log(iframeRef.current)
  }

  const getAudioVideoSection = () => {
    return (
      <div className='block'>
        {data.note ? <video src={data.note} controls></video> : ""}
        {data.noteIta ? <div className="my-2 flex flex-col">
          <div className="mt-2">Audio</div>
          <audio controls>
            <source src={data.noteIta} type="audio/mp3"></source>
          </audio>
        </div>
          : ""
        }
      </div>
    )
  }

  const getOverviewSection = () => {
    let item = annotationsLinks.find(link => link.acf.ids.includes(`.${data.id}`));
    console.log(item);

    return (
      <div className='w-full h-full'>
        {/* {data.content.raw} */}
        <iframe
          ref={iframeRef}
          src={!item ? "https://globalsearoutes.net/annotazioni/annotation-not-available//" : item.acf.url_iframe}
          onLoad={onLoad}
          className="min-h-[100%] h-full w-full !border-0"
        ></iframe>
      </div>
    )
  }


  return (
    <div className="expansion-section !text-[15px] h-[85%]">
      <div className="header py-3 my-0 gap-x-[12px] flex sticky top-[60px] bg-white hidden">
        {tabs.map(tab => (
          <Button
            className={`tab-button ${activeTab == tab.id ? "!bg-[#AD9A6D] !text-white" : "!bg-[#fff]"} !text-[12px] !py-[1px] !px-[14px] min-w-[80px] h-[38px]`}
            // className={`min-w-[80px] h-[38px]  !rounded-full flex justify-evenly !border-[1px] !border-[#CDCDDF] !text-[#403F43] ${activeTab == tab.id ? "!bg-[#AD9A6D] !text-white" : "!bg-[#fff]"}`} 
            label={tab.name}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      <div className="content h-full">
        {activeTab == "overview" ? getOverviewSection() : ""}
        {activeTab == "audio_video" ? getAudioVideoSection() : ""}
      </div>
    </div>
  )
}


/*
  - Sticky Row Expansion: 
  - Bar to hide sketchfab icons:Done
  - draggable table section:Done
  - Remove view options: Done
  - 
*/
export default App
