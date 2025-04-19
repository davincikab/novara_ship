/* eslint-disable react/prop-types */
import { useState, useRef } from 'react';
// import { useLocalization, useTranslation } from './LocalizationProvider';
import { RiArrowDownSLine } from '@remixicon/react';
// import { useOnClickOutside } from 'usehooks-ts';
import { useTranslation, useLocalization } from './LocalizationProvider';
import useOutsideClick from './hooks/useOustsideClick';

export default function LanguageDiv({ bgColor="transparent"}) {
    const t = useTranslation();
    const { languages, language, setLanguage } = useLocalization();
    const languageList = Object.entries(languages).map((values) => ({ code: values[0], country: values[1].country, name: values[1].name }));
    
    const [state, setState] = useState ({
        openLanguageDropwdown:false,
        openCollapsible:false
    });

    // useOutsideClick
    const countryFlags = {
        'en':'/icons/en.png',
        'it':'/icons/it.png',
    }

    const ref = useRef(null);
    useOutsideClick(ref, () => {
        setState((prevState) => ({...prevState, openLanguageDropwdown:false}));
    });

    let isTransparent = bgColor == "transparent";

    return (
        <div className='relative' ref={ref}>
            
            <button 
                type="button" 
                onClick={() => { setState({...state, openLanguageDropwdown: !state.openLanguageDropwdown})}} 
                className={`md:px-3 ${isTransparent ? 'md:text-white' :'text-black'} md:text-[13px] text-black border-[#A7AFBE] md:top-[10px] md:h-[40px] bg-white md:w-auto border-[1px] rounded-full md:right-10 h-10 w-10 flex items-center font-medium justify-center px-1 md:py-1 text-xs cursor-pointer md:border-[#A7AFBE] `}
            >
                <div className="md:me-2 flex items-center justify-center overflow-hidden rounded-full">
                    {/* <ReactCountryFlag countryCode={languages[language].country} svg className=' text-[24px] rounded-full'/>  */}
                    <img src={countryFlags[language]} alt="" className='h-full rounded-full md:w-[30px] w-[30px]' /> 
                </div>
                <span className='md:me-1 font-bold uppercase hidden md:block'>
                    {language}
                </span>
                <RiArrowDownSLine className="hidden md:block"/>
            </button>

           {/* SELETTORE LINGUA
            */}
             <div 
                className={`z-[60] absolute text-[14px] w-24 md:top-[35px] md:right-0 right-0 top-[15px] ${state.openLanguageDropwdown ? "" : "hidden"} p-3 my-4 text-base list-none bg-white  rounded-lg shadow`} 
                id="language-dropdown-menu"
                
            >
                {/* <h5 className="uppercase py-3 font-semibold text-[#445069]">
                    {t('selectLanguage')}
                </h5> */}
                <ul className="!p-0 !m-0">
                    {languageList.map((it) => (
                        <li key={it.code} value={it.code} className='bg-200 md:h-[30px] h-[20px] mb-[12px]'>
                            <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setLanguage(it.code); setState({...state, openLanguageDropwdown:false}) }} 
                                className="font-semibold text-black hover:bg-gray-0 flex items-center" 
                                role="menuitem"
                            >
                                <div className="inline-flex items-center">
                                    <div className="bg-white me-2 flex items-center justify-center overflow-hidden rounded-full">
                                        {/* <ReactCountryFlag countryCode={it.country} svg className='text-[30px] rounded-full '/>  */}
                                        <img src={countryFlags[it.code]} alt="" className='h-full rounded-full md:w-[30px] w-[20px]' /> 
                                    </div>   
                                    <span className='uppercase text-sm-'>{it.code} </span>
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
