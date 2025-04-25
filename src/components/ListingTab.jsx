import React, { use, useEffect } from 'react'
import useDeviceDetection from '../hooks/useDeviceDetection';

import { RiLock2Line, RiDraggable, RiArrowLeftDoubleLine, RiArrowLeftSLine, RiGalleryLine, RiCloseLine, RiExpandDiagonal2Line, RiExpandDiagonalLine, RiHome2Line, RiHome3Line, RiHome4Line, RiSailboatFill, RiSailboatLine, RiSearch2Line, RiTriangleLine, RiLoader2Fill, RiArrowUpDoubleLine, RiArrowDownLine, RiArrowDownSLine, RiFileVideoFill, RiFolderMusicFill, RiMore2Fill, RiMoreFill, RiInformationLine, RiArrowRightSLine } from '@remixicon/react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import Icons from '../Icons';

import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import DetailTab from './DetailTab';
import { useTranslation } from '../LocalizationProvider';
import { useSwipeable } from 'react-swipeable';

export default function ListingTab({ 
    annotations, setSelectedAnnotation, setExpandedRows, expandedRows, language, openDetailTab,
    boatSections, activeDeck, annotationsLinks, setFullMode, fullMode, toggleTable, isTableOpen
}) {
    const device = useDeviceDetection();
    const draggableRef = React.useRef(null);
    const [isDetailTabOpen, setIsDetailTabOpen] = React.useState(false);
    const t = useTranslation();

    const handlers = useSwipeable({
      onSwiped:(eventData) => {
          if(eventData.dir == "Down") {
              toggleTable();
          }
         
      }
  })

    useEffect(()    => {
        if (expandedRows) {
            setIsDetailTabOpen(true);
        }else {
            setIsDetailTabOpen(false);
        }
    }, [expandedRows]);

    const closeDetailTab = () => {
        setExpandedRows(null);
        setIsDetailTabOpen(false);   
        
        window.apiClient.unselectAnnotation();
    }

    const collapseListingTab = (e) => {
        e.stopPropagation();
        toggleTable(e);
    }

    const gotoAnnotation = (index) => {
      if(index < 1) {
        index = annotations.length - 1;
      } 

      if(index > annotations.length) {
        index = 1;
      }
      
      setExpandedRows({ [index]: true });
      window.apiClient.gotoAnnotation(index - 1);
    }

    const renderHeader = () => {
        return (
          <div className=" handle flex justify-between !text-[#403F43] flex-col h-full overflow-hidden relative">

            <section {...handlers} className="cursor cursor-move py-3 text-[#403F43] font-bold text-[18px] flex items-center bg-lack my-2 z-0"> 
              <div className="flex-1 flex items-center">
                <span className="mx-2 hidden"><Icons name={activeDeck} is_active={false} /> </span>
                {/*               {t(activeDeck)}  TESTO PONTE */}
              </div>

              
              <div className='flex-1 bg-red-00'>
                <RiDraggable className='rotate-[90deg]' size={32} />
              </div>
    
              <div className="w-[40px] h-[40px]">
    
              </div>
            </section>
    
    
            <Button
                onClick={(e) => collapseListingTab(e)}
                className={`close-btn no-cursor !absolute ${expandedRows ? `top-[20px] right-[10px]` : "top-[20px] right-[10px]"} !h-[40px] !w-[40px] !p-0 flex items-center justify-center !z-12 !border-[2px]`}
            >
                <RiCloseLine color='#403F43' className='!font-bold text-2xl' size={24} />
            </Button> 

            <div className='w-full flex items-center justify-center hidden'>     
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => setFullMode(true)} label={t("full")} className={"  !text-[12px] !rounded-full !border-[#AD9A6D] h-[30px] w-[70px] " + (fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
                <Button onClick={() => setFullMode(false)} label={t("single")} className={"  !text-[12px] !rounded-full !border-[#AD9A6D] h-[30px]  w-[70px] " + (!fullMode ? "!bg-[#AD9A6D] !text-white" : "!bg-[inherit]")} />
              </div>
            </div>
          </div>
        );
    };

    const getContent = () => {
        let annotationsInfo = annotationsLinks.filter(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.`));

        const hasInfo = (id) => {
            return annotationsInfo.find(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.${id}`));
        }

        const hasVideo = (id) => {
            return annotationsInfo.find(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.${id}`) && entry.acf.video);
        }

        const hasAudio = (id) => {
            return annotationsInfo.find(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.${id}`) && entry.acf.audio);
        }


        return (
            <div className={`!bg-[#fff] listing-section overflow-hidden w-full mt-[0px] rounded-[16px] h-full  ${isTableOpen ? 'opacity-[100] visible' : 'opacity-[0] invisible' }`}   >

                  <div className="list-group w-full overflow-hidden relative h-full">

                    <div className="relative bg-white h-full">
                      <div className="h-16">
                        {renderHeader()}
                      </div>
                      

                      <div className="annotation-list h-[calc(100%_-_100px)] overflow-auto p-2">
                        {
                          annotations
                            .map((annotation, index) => {
                              return (
                                <div 
                                  className={`full list-item bg-white rounded-sm shadow-sm cursor-pointer hover:bg-gray-200 p-2 my-2 border-[0px] border-[#d9d9d9] text-[#403F43] flex flex-col`}
                                  onClick={(e) => { e.stopPropagation(); setExpandedRows({ [parseInt(annotation.id)]: true }); setIsDetailTabOpen(true); setSelectedAnnotation(annotation); }}
                                  key={annotation.id}
                                >
                                  <div className="d-flex">
                                    {/* <div className='flex items-center justify-between mx-2'>
                                      <RiArrowDownSLine />
                                    </div> */}

                                    <div className='font-bold text-[15px]'>{annotation.name}</div>
                                  </div>

                                  <div className='flex flex-1 text-gray justify-between items-center text-[12px] mt-2'>
                                    { hasVideo(annotation.id) ? <div className='text-[12px] items-center flex'> <RiFileVideoFill className="mr-1" size={20} color={"#999"} /> Video</div> : ""}   
                                    { hasAudio(annotation.id) ? <div className='text-[12px] items-center flex'><RiFolderMusicFill className="mr-1" size={20}  color={"#999"} /> Audio</div> : ""}    
                                    { hasInfo(annotation.id) ? <div className='text-[12px] items-center flex'><RiInformationLine className="mr-1" size={20}  color={"#999"} /> Info </div> : ""}                              
                                  </div>
                                </div>
                              )
                            })
                        }
                      </div>
                    </div>
                        
                    
                    <div className="h-full w-full">
                        { // ANNOTATION SCEDA INTERNA SECTION (quella che si apre con i detagli sull'annotation)
                        (annotations.length) ? 
                            <DetailTab 
                                expandedRows={expandedRows} 
                                language={language} 
                                annotations={annotations}
                                annotationsLinks={annotationsLinks}
                                boatSections={boatSections}
                                activeDeck={activeDeck}
                                closeDetailTab={closeDetailTab}
                                isDetailTabOpen={isDetailTabOpen}
                            /> : ""
                        }

                        {isDetailTabOpen && <div className="absolute bottom-2 z-4 flex justify-between items-center w-full h-[50px] bg-white border-t-[1px] border-[#d9d9d9] px-2">
                          <div className="flex-1">
                            <Button className='nav-btn btn-sm text-black text-[12px]' onClick={() => gotoAnnotation(parseInt(Object.keys(expandedRows)[0]) - 1)} >
                              <RiArrowLeftSLine size={18}/>
                              Prev
                            </Button>
                          </div>

                          <div className="flex-1 flex items-center text-[12px] text-[#888]">{parseInt(Object.keys(expandedRows)[0])} /  {annotations.length}</div>

                          <Button className='nav-btn btn-sm text-black text-[12px]' onClick={() => gotoAnnotation(parseInt(Object.keys(expandedRows)[0]) + 1)} >
                            Next
                            <RiArrowRightSLine size={18}/>
                          </Button>
                        </div>}
                    </div>

                    
                </div>
            </div>
        );
    }

    if(device == "Mobile") {
        // ${!isOpen ? 'top-[100vh]' : 'top-[100px]'}
        return (
            <div className={`detail-tab !absolute w-full z-[10] h-[calc(100svh-120px)] left-0  ${isTableOpen ? "translate-y-[100px]" : "translate-y-[100vh]" } transition-transform duration-700 !p-0 border-0 no-cursor`}>
                { annotations.length ? getContent() : ""}
            </div>
        )
    }

    // console.log(isDetailTabOpen, expandedRows, openDetailTab);
    return (true &&
        <Draggable
            nodeRef={draggableRef}
            handle="section"
            bounds="body"
          >
            {/* <div ref={draggableRef} className="draggable-box relative bg-black"> */}



            <div
              ref={draggableRef}
              className={`draggable-div ${isTableOpen ? "translate-y-[100px]" : "translate-y-[100vh]" } transition-transform duration-700 !fixed z-[10] top-24 md:right-[10px] !p-0 border-0 no-cursor`}
            >


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
               {getContent()} 
              </ResizableBox >
            </div>
          </Draggable>
    )
}
