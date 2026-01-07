import { Ride } from "@/types/index";

/*
 Date format should be DD/MM/YYYY while Searching
*/

function formatDate(date: string | Date){
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

export function searchPanel(rides: Ride[], query: string){
    if(!query.trim()) return rides;

    const q = query.toLowerCase();

    return rides.filter((ride) => {
        const dateMatch = ride.departureTime && formatDate(ride.departureTime).includes(q);

        const locationMatch = ride.destination?.toLowerCase().includes(q);

        const creatorMatch = ride.creator?.email.toLowerCase().includes(q);

        return (
            dateMatch ||
            locationMatch ||
            creatorMatch
        );
    });
}