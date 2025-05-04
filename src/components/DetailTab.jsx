import { RiArrowLeftDoubleLine, RiDraggable, RiLoader2Fill } from '@remixicon/react';
import { Button } from 'primereact/button';
import React, { useState, useRef, useEffect } from 'react'

export default function DetailTab({expandedRows, language, annotations, annotationsLinks, boatSections, activeDeck, closeDetailTab, isDetailTabOpen}) {
  return (
    <div className={`sticky-section z-[10] h-[calc(100%_-_50px)] overflowauto max-w-full w-full absolute top-[0px] transition-all duration-500 ease-in-out ${isDetailTabOpen ? 'left-0' : 'left-[100%]'} !bg-[#fff]`}>
        {expandedRows && 
            <>
                <div className="relative header-section p-3 sticky top-0 bg-[inherit] w-full z-2">
                <section className='handle cursor flex justify-between items-center w-[90%] bg-white'>
                    <div className='flex items-center flex-row-reverse my-2 w-full'>
                    <div className='hidden'>{annotations[parseInt(Object.keys(expandedRows)[0]) - 1].name}</div>
                    <div className='flex-1 flex justify-center'>
                        <RiDraggable className='rotate-[90deg]' size={32} />
                    </div>
                    <div className="h-[40px] w-[40px] flex items-center justify-center"></div>                     
                    </div>
                </section>

            <Button
                onClick={(e) => { e.stopPropagation(); closeDetailTab()}}
                className="!absolute top-[20px] left-[15px] !bg-[#e7e7e7] !border-[#AD9A6D] !rounded-full !p-0 z-[25] flex items-center justify-center !h-[40px] !w-[40px] !border-[2px] !mr-2"
            // className='!absolute top-[20px] right-[20px] flex items-center justify-center  !border-[4px] !border-[#AD9A6D] h-[50px] w-[50px] !p-1 rounded-full' rounded
            >
                <RiArrowLeftDoubleLine color='#403F43' className='!font-bold text-2xl' size={22} />
            </Button>
            </div>

            <div className="px-2 h-[calc(100%_-_90px)] z-0">
              <RowExpansionTemplate
                  data={annotations[parseInt(Object.keys(expandedRows)[0]) - 1]}
                  annotationsLinks={annotationsLinks.filter(entry => entry.acf.ids.includes(`${boatSections[activeDeck].floor}.`))}
                  floor={boatSections[activeDeck].floor}
                  language={language}
              />
            </div>
        </>
        }
    </div>
  )
}


const RowExpansionTemplate = ({ data, annotationsLinks, language, floor }) => {
    // console.log(annotationsLinks);
  
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef(null)
  
    const tabs = [
      { name: "Overview", id: 'overview' }, { name: "Audio & Video", id: "audio_video" },
      { name: "Technical Specs", id: 'technical_specs' }
    ];

    const toggleIframeLanguage = (iframe, lang) => {   
        try {
            // let turnOffLang = lang == "en" ? "ita" : "eng";
            
            // const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow.document;
        
            // iframeDoc.querySelectorAll(`.${turnOffLang}`).forEach(elem => {
            //     elem.style.display = "none";
            // }); 
            // setIsLoading(false);
        } catch (error) {
            // setIsLoading(false);
        } finally {
            // setIsLoading(false);
        }
        
    }
    
    useEffect(() => {
        if (iframeRef.current) {
            toggleIframeLanguage(iframeRef.current, language);
        }
    }, [language]);

    const onLoad = () => {
      setIsLoading(false);
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
      let item = annotationsLinks.find(link => link.acf.ids === `${floor}.${data.id}`);
      let url =  item ? item.acf.url_iframe + `?${language}` : ""; 

      return (
        <div className='w-full h-full relative'>
          {/* {data.content.raw} */}
          
          <div className={`loader ${!isLoading ? 'opacity-0 hidden' : 'opacity-100'} absolute top-0 w-full h-full bg-[#fff] z-[100] flex flex-col items-center justify-center`}>
            <RiLoader2Fill className='animate-spin duration-[5000]' size={32} color='#000'/>
            <p className='text-black'>Loading...</p>
          </div>
          
          
          <iframe
            ref={iframeRef}
            src={!item ? `https://globalsearoutes.net/annotazioni/annotation-not-available/?${language}` : url}
            onLoad={onLoad}
            className="min-h-[100%] h-full w-full !border-0 z-0" 
            allowFullScreen
          ></iframe>
        </div>
      )
    }
  
    return (
      <div className="expansion-section !text-[15px] h-full">
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

  