import { useEffect, useRef, useState } from 'react'

import './App.css';
import SketchfabViewer from './SketchfabViewer';
import { RiLock2Line, RiArrowLeftDoubleLine, RiArrowLeftSLine, RiGalleryLine, RiCloseLine, RiExpandDiagonal2Line, RiExpandDiagonalLine, RiHome2Line, RiHome3Line, RiHome4Line, RiSailboatFill, RiSailboatLine, RiSearch2Line, RiTriangleLine } from '@remixicon/react';
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

const part0 = 99; //  vele_alberi_corde
const part1 = 248; //  piano1 1050, 1115, 315
const part2 = 2619; //  piano_2 1172
const part3 = 8131; //  piano_3 7551
const part4 = 11817; //  piano_4 2053
const part5 = 12571; // piano_scafo_inferiore  


const boatSections = {
  'sails':{floor:0, cam:camSA, part:part0, annotations:gaSails, name:"Sails"}, 
  'mainDeck':{floor:1, cam:camMD, part:part1, annotations:gaMainDock, name:"Main Deck"}, 
  'upperDeck':{floor:2, cam:camUD, part:part2, annotations:gaUD, name:"Upper Deck"}, 
  'lowerDeck':{floor:3, cam:camLD, part:part3, annotations:gaLD, name:"Lower Deck"},
  'hold':{floor:4, cam:camHO, part:part4, annotations:gaHO, name:"Hold"}, 
  'lowerHold':{floor:5, cam:camLH, part:part5,annotations:gaLH, name:"Lower Hold" }
};


// const iSails = new NovaraParts("sails", part0, camSA);
// const iMainDeck = new NovaraParts("mainDeck", part1, camMD);
// const iUpperDeck = new NovaraParts("upperDeck", part2, camUD);
// const iLowerDeck = new NovaraParts("lowerDeck", part3, camLD);

// const iHold = new NovaraParts("hold", part4, camHO);
// const iLowerHold = new NovaraParts("lowerHold", part5, camLH);
// const floors = [iSails, iMainDeck, iUpperDeck, iLowerDeck, iHold, iLowerHold];

function App() {
  let api;

  const draggableRef = useRef(null);

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

  const [state, setState] = useState({
    annotations:[],
    annotationCount:[],
    parts:5,
    partsRange:[0,5],
    isTableOpen:false,
    isModelControlExpanded:false,
    isViewOptionExpanded:false
  })

  const toggleModal = () => {

  }

  const onsuccess = (apiClient) => {
      // console.log("Success");
      api = apiClient;
      window.apiClient = apiClient;

      // console.log(api);

      api.addEventListener("viewerready", function () {
        console.log("View Ready");
        // document.getElementById("panel").classList.remove("hidden");
        api.getSceneGraph(function (err, result) {
          if (err) {
            console.log("Error getting nodes");
            return;
          } // get the id from that log
          //console.log(result);
          api.load(function () {
            window.console.log("Viewer loaded");
            playSound();
          });
    
          // Eventi per le animazioni
          api.addEventListener("animationEnded", () => {
            window.console.log("Animation ended");
            // riabilitaButton();
          });
    
          api.addEventListener("animationPlay", () => {
            window.console.log("Animation play");
            // disabilitaButton();
          });
    
    
          //PATCH che nasconde refusi del modello
          api.hide(13561); //lampada nell'lowerHold
    
          // EVENTI PER LE ANNOTAZIONI
          api.getAnnotationList(function (err, annotations) {
            if (!err) {

              setState((prevState) => ({
                ...prevState,
                annotationsList:annotations,
                annotationCount:annotations.length
              }))
             
              // console.log(annotations);
            }
          });
    
          api.addEventListener("annotationSelect", function (info) {
            console.log('annotationSelect', info);
            if (info === -1) {
              return;
            }
            // console.log('annotationSelect', info);
           
            //playSound();
            //console.log(annotationsList[info].name + (annotationsList[info].content ? annotationsList[info].content.rendered : ''));
          });
    
          api.addEventListener("annotationFocus", function (info) {
            console.log('annotationFocus', info);

            console.log(state.annotations[info]);
            setExpandedRows(state.annotations[info]);
          });
    
          api.addEventListener("annotationBlur", function (info) {
            //console.log('annotationBlur', info, annotationsList[info]);
          });
        });
      });
  }


  const onerror = () => {
    console.error("Sketchfab API error");
  };

  const onClick = (e) => {
    let { id } = e.target;
    // console.log("Click:", id, fullMode);
    // console.log(window.apiClient);
    if(!window.apiClient) {
      return;
    }

    console.log(boatSections[id]);
    let { cam, part, annotations, floor} = boatSections[id];

    // if(fullMode) {
    nascondiTutto();
    if(activeDeck == id) {
      setActiveDeck("");
      resetCam();
      
      setState(prevState => ({...prevState, annotations:[], annotationCount:0}));
      removeAnnotations();
    } else {
      window.apiClient.seekTo(4.12);
      if(!fullMode) {
        console.log("Part:", floor);
        nascondiTutto();
        mostraSoloParte(part);
      } else {
        mostraTutto();
      }

      // return;
     
      window.apiClient.setCameraLookAt(cam.eye, cam.target);
      setState(prevState => ({...prevState, annotations:[...annotations.map((entry, i) => ({...entry, id:i+1}))], annotationCount:0}));
      setSelectedAnnotation(null)
      setActiveDeck(id);

      removeAnnotations();
      createAnnotations(annotations);
    }

    // setActiveDeck(id);
  }

  const createAnnotations = (annotations) => {

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
    window.apiClient.removeAllAnnotations(function (err) {
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
    if(!e.value) {
      return;
    }

    setSelectedAnnotation(e.value);  

    let annotationIndex = state.annotations.findIndex(annotation => annotation.id == e.value.id);
    window.apiClient.gotoAnnotation(annotationIndex); 
  }

  useEffect(() => {
    if(window.apiClient) {
      fullMode ? mostraTutto() : "";
      if(!fullMode && activeDeck) {
        nascondiTutto();
        mostraSoloParte(boatSections[activeDeck].part);
      }

    }
  }, [fullMode, activeDeck]);

  const getIcon = (section, size=18) => {
    return <Icons name={section} size={size} is_active={section == activeDeck } />
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
    setState({...state, annotationCount:0, annotations:[]})
    setActiveDeck("");

    setState((prevState) => ({...prevState, parts:e.value}));

    if(e.animate) {
      let { value } = e;
      value == 5 ? openModel() : closeModel();
    } else {
      window.apiClient.seekTo(e.value);
    }
  }

  const onRangeChange = (e) => {
    setState({...state, partsRange:e.value});
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
    setState({...state, isTableOpen:!state.isTableOpen})
  }

  const renderHeader = () => {
      return (
          <div className="flex justify-between !text-[#403F43] !bg-white flex-col h-full overflow-hidden">
              <div className="py-3 text-[#403F43] font-bold text-[18px] flex items-center">
                <span className="mx-2"><Icons name={activeDeck} is_active={false}/> </span>
                
                {boatSections[activeDeck].name}
              </div>

              <div className='w-full flex items-center justify-between'>
                <IconField iconPosition="left" className='flex-1'>
                    <RiSearch2Line className='top-[10px] left-2 absolute !text-[#7B838A]' size={20} />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Search by ID, name " className='w-full h-10 !text-[13px] !rounded-[5px]' />
                </IconField>

                <div className="flex items-end my-2 ml-3 gap-x-2">
                  {/* <ButtonGroup className=""> */}
                      <Button onClick={() => setFullMode(true)} label="Full" className={"  !text-[12px] !rounded-full !border-[#AD9A6D] h-[30px] w-[70px] " + (fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
                      <Button onClick={() => setFullMode(false)} label="Single"className={"  !text-[12px] !rounded-full !border-[#AD9A6D] h-[30px]  w-[70px] " + (!fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")}/>
                  {/* </ButtonGroup> */}
                </div>
              </div>
          </div>
      );
  };

  const lockTemplate = (rowData, options) => {
    const icon = options.frozenRow ? <RiLock2Line /> : <RiCloseLine />
    const disabled = options.frozenRow ? false : state.annotations.length >= 2;
    console.log(disabled);

    return <Button type="button" className="p-button-sm p-button-text" onClick={(e) => { e.stopPropagation(); toggleLock(rowData, options.frozenRow, options.rowIndex)} } >
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
    setState({...state, annotations:_unlockedAnnotations});
};


  const rowExpansionTemplate = (data) => {
    // console.log(data);
    return( <RowExpansionTemplate data={{...data}} />)
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
    setState({...state, annotations:[]})
  }

  const modelUid = "03264464875242bda7e9c07da6921df8";
  console.log(expandedRows);
  // console.log(lockedAnnotations);
  return (
      <div className='w-full h-full p-[20px] px-[40px] !bg-[#e7e7e7] main-section'>
          <div className="navbar mb items-center flex ">
            <div className="logo-section">
              <img src="/logo.png" alt="Novara Vessel" className='w-[60px]' />
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
            
            {/* <hr /> */}
          </div>

          <div className="main w-full h-[85%] mt-[40px] relative !bg-[transparent] overflow-hidden">
            <div className="absolute top-[0px] left-0 bg-[bla] p-2 flex items-center z-[10]">
              <Button onClick={resetViewer} className='!bg-[#f1f1f1] border-[0.5px] !border-[#CDCDDF] h-[40px] w-[40px] backrop-blur-[30px] !p-1 flex items-center justify-center rounded-full' rounded>
                <RiArrowLeftSLine size={30} color=''/>
              </Button>  

              <div className='flex flex-col !mx-4 title-section'>
                <h5 className="font-bold text-[22px] text-[#403F43] my-0">Novara</h5>
                <div className='text-[#5D6C71] text-[14px] my-0 capitalize'> { activeDeck ?boatSections[activeDeck].name : ""}</div> 
              </div> 
            </div>

            { (state.annotations.length && !showMedia) ? <Button onClick={toggleMediaSection} className='!absolute z-[10] top-[80px] left-2 flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[48px] w-[48px] !p-1 !rounded-full' rounded>
                <RiGalleryLine color='#403f43' className='!font-bold' size={24} />
            </Button> : '' }

            { showMedia ? <div class="!absolute z-[10] top-[60px] left-2 !bg-[#e7e7e7] media-section w-[400px] shadow-md rounded-[8px] max-h-[85%] overflow-y-auto">
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

                      {item.note ?  <video src={item.note} controls></video> : ""}
                      {item.noteIta ?  <div className="my-2 flex flex-col"> 
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
            </div> : "" }

            { (activeDeck && !state.isTableOpen ) ? <Button onClick={toggleTable} className='!absolute z-[10] top-[5px] right-4 flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 !rounded-full' rounded>
                <RiArrowLeftDoubleLine color='#403F43' className='!font-bold' size={28} />
              </Button> : "" }

            { (activeDeck && state.isTableOpen ) && 
            <Draggable nodeRef={draggableRef} >
              {/* <div ref={draggableRef} className="draggable-box relative bg-black"> */}
                
              
              <div 
                ref={draggableRef}
                className="draggable-div !fixed z-[10] right-[20px] top-[120px]"
                // className="fixed z-[10] right-[50px] top-[145px] bg-[#e7e7e7]/60 backrop-blur-[2px] rounded-lg shadow-sm shadow-[#f1f1f1] w-[450px] h-[fit-content] text-black"
              > 

                <div className="cursor-move absolute top-0 w-full h-[80px] bg-[inherit]"> 
                </div>

                <Button 
                  onClick={toggleTable} 
                  className="close-btn !absolute top-[20px] right-[20px] !p-0 flex items-center justify-center"
                  // className='!absolute top-[20px] right-[20px] flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 rounded-full' rounded
                >
                  <RiCloseLine color='#403F43' className='!font-bold text-2xl' size={28} />
                </Button>

                <div className="h-full overflow-hidden h-full w-full mt-[80px] rounded-[8px]">  
                  <div className="list-group h-[80%] overflow-y-auto relative">

                      <DataTable 
                        value={state.annotations.filter(item => !lockedAnnotations.find(annotation => annotation.id == item.id))} 
                        selectionMode="single" 
                        selection={selectedAnnotation}
                        onSelectionChange={onSelectionChange} 
                        header={renderHeader()}
                        filters={filters} 
                        // filterDisplay="row" 
                        // loading={loading}
                        globalFilterFields={['name',]}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => { console.log(e); setExpandedRows(e.data); }}
                        rowExpansionTemplate={rowExpansionTemplate}
                        dataKey="id" 
                        className='!bg-white'
                        tableStyle={{ minWidth: '20rem', background:"white" }}
                        scrollable
                        scrollHeight="300px"
                        frozenValue={lockedAnnotations}
                        style={{ background:"white"}}
                      >
                          <Column field="id" header="ID" sortable style={{ textAlign:"center"}} ></Column>
                          <Column field="name" header="Annotation Name" sortable></Column>
                          <Column expander={allowExpansion}  />

                          {/* <Column style={{ flex: '0 0 4rem' }} body={lockTemplate}></Column> */}
                      </DataTable>

                      { (expandedRows) ? <div className="sticky-section z-[10] h-[100%] overflow-y-auto w-full absolute top-[0px] left-0 !bg-[#fff]">
                        <div class="header-section text-whit p-3 sticky top-0 bg-[inherit] w-full z-2">
                          <div className='flex justify-between items-center'>
                            <div className=''>
                              {state.annotations[Object.keys(expandedRows)[0]].name}
                            </div>

                            <Button 
                              onClick={(e) => setExpandedRows(null)} 
                              className="close-btn !p-0 flex items-center justify-center !relative !h-[40px] !w-[40px] !border-[2px]"
                              // className='!absolute top-[20px] right-[20px] flex items-center justify-center !bg-[#CAC2B0] !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 rounded-full' rounded
                            >
                              <RiCloseLine color='#403F43' className='!font-bold text-2xl' size={22} />
                            </Button>
                          </div>
                        </div>
                        <div className="px-2 h-full z-0">
                            <RowExpansionTemplate data={state.annotations[Object.keys(expandedRows)[0]]} />
                        </div>

                      </div> : ""}
                  </div>

                  <div className="footer-section bg-white w-full !border-t-[1px] !border-[#CDCDDF]">
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
                  </div>
                </div>
              {/* </div>   */}
              
              </div>
            </Draggable> 
            }

            <div className="w-full h-[95%] bg-[#e7e7e7] shadow-none border-[0px] rounded-md relative">
              <div className="h-16 absolute !bg-[#e7e7e7] w-full"></div>
              <div className="h-full w-full">
                <SketchfabViewer modelUid={modelUid} success={onsuccess} error={onerror} />
              </div>
              

              {/* <Button label='Close' onClick={() => {onLevelsChange({value:0, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' /> */}

              <div className="bg-[#e8e8e8] rounded-md !w-[400px] p-2 flex flex-col justify-between w-full h-auto absolute left-2 bottom-2">
                <div className="slider-section my-2 mb-3 w-[95%] mx-auto">
                  <div htmlFor="" className='mb-2'>Levels</div>
                  <Slider value={state.parts} onChange={onLevelsChange} max={5} min={0} step={0.1} className='focus:!bg-[#AD9A6D] '/>
                </div>

                <div className="flex justify-between mt-3">
                  <Button label='Close' onClick={() => {onLevelsChange({value:0, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
                  <Button label='Open'  onClick={() => {onLevelsChange({value:5, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
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
                    onClick={() => setState({...state,isModelControlExpanded:!state.isModelControlExpanded })}
                    className='!bg-[#f1f1f1] border-[1px] !border-[#CDCDDF] h-[40px] w-[40px] !p-1 flex items-center justify-center rounded-full' 
                  >
                      <RiExpandDiagonalLine size={19}/>
                      <RiExpandDiagonal2Line size={19} className='absolute'/>
                  </Button>       
                </div>
                    
                {
                  state.isModelControlExpanded ? 
                  <>
                    <hr className='!bg-[#878787] border-[#878787] '/>
                    <div className="body py-2 flex flex-col justify-between w-full h-auto">
                      <div className="slider-section my-2 mb-3 w-[95%] mx-auto">
                        <Slider value={state.parts} onChange={onLevelsChange} max={5} min={0} step={0.1} className='focus:!bg-[#AD9A6D] '/>
                      </div>

                      <div className="flex justify-between mt-3">
                        <Button label='Close' onClick={() => {onLevelsChange({value:0, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
                        <Button label='Open'  onClick={() => {onLevelsChange({value:5, animate:true})}} className='!px-[12px] !py-[5px] !border-[#CDCDDF] !bg-[inherit] !rounded-[100px] !text-[10px]' />
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
                    onClick={() => setState({...state,isViewOptionExpanded:!state.isViewOptionExpanded })}
                  >
                      <RiExpandDiagonalLine size={19}/>
                      <RiExpandDiagonal2Line size={19} className='absolute'/>
                  </Button>       
                </div>

                {
                  state.isViewOptionExpanded ? 
                  <>
                    <hr className='!bg-[#878787] border-[#878787] '/>

                      <div className="body py-2 ">
                        <div className="flex w-full items-center justify-center my-2 mb-4">
                          <ButtonGroup>
                              <Button onClick={() => setFullMode(true)} label="Full" className={"!rounded-l-xl !border-[#AD9A6D] h-[35px] w-[110px] " + (fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
                              <Button onClick={() => setFullMode(false)} label="Single"className={"!rounded-r-xl !border-[#AD9A6D] h-[35px]  w-[110px] " + (!fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")}/>
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


const RowExpansionTemplate = ({data}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    {name:"Overview", id:'overview'}, { name:"Audio & Video", id:"audio_video"},
    {name:"Technical Specs", id:'technical_specs'}
  ];

  const getAudioVideoSection = () => {
    return(
      <div className='block'>
        {data.note ?  <video src={data.note} controls></video> : ""}
        {data.noteIta ?  <div className="my-2 flex flex-col"> 
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
    return (
      <div className='w-full'>
          {data.content.raw}

        <iframe src="https://globalsearoutes.net/collections/a3073/" className="min-h-[80vh] h-full w-full"></iframe>
      </div>
    )
  }


  return (
    <div className="expansion-section !text-[15px] h-[fit-content] min-h-[50vh]">
      <div className="header my-3 gap-x-[12px] flex">
        {tabs.map(tab =>  (
          <Button 
            className={`tab-button ${activeTab == tab.id ? "!bg-[#AD9A6D] !text-white" : "!bg-[#fff]"} !text-[12px] !py-[1px] !px-[14px] min-w-[80px] h-[38px]`}
            // className={`min-w-[80px] h-[38px]  !rounded-full flex justify-evenly !border-[1px] !border-[#CDCDDF] !text-[#403F43] ${activeTab == tab.id ? "!bg-[#AD9A6D] !text-white" : "!bg-[#fff]"}`} 
            label={tab.name} 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      <div className="content">
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
