import {PUNE_BBOX} from "@/lib/constants";

export function inPune(lat:number,lng:number){
    return(
        lat>= PUNE_BBOX.minLat &&
        lat<= PUNE_BBOX.maxLat &&
        lng>= PUNE_BBOX.minlng &&
        lng<= PUNE_BBOX.maxLng
    );
}

export function roundCoord(n:number){
    return Math.round(n*1000) /1000;
}

export function societyKey(societyName:string,areaSlug:string){
    return `${societyName.trim().toLowerCase()}:${areaSlug}`;
}
