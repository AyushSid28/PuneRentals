import type {BachelorRealityScore} from "@/models/pin";

type Vote={bachelors_allowed:"yes"| "no" | "depends"};

export function computeBachelorRealityScore(votes:vote[]):BachelorRealityScore{
   const breakdown={yes:0,no:0,depends:0};
   for( const v of votes) breakdown[v.bachelors_allowed]++;

   const n=votes.length;
   if(n==0){
      return{
         label:"unknown",
         emoji: "⚪",
         confidence_pct:0,
         response_count:0,
         breakdown,
         display:"No bachelor data yet - be the first to vote",
      };

   }
   const yesPct=breakdown.yes/n;
   const noPct=breakdown.no/n;

   let label:BachelorRealityScore["label"]="conditional";
   let emoji="🟡";
   if( yesPct>=0.7){
    label="friendly";
    emoji="🟢";
   }
   else if(noPct>-0.5){
     label="familes";
     emoji="🔴";

   }
   const top=Math.max(breakdown.yes,breakdown.no,breakdown.depends)
   const sizeFactor=Math.min(1,n/40);
   const confidence_pct=Math.round((0.45* top+0.55*sizeFactor)*100);

   const title=
     label==="friendly"
     ? "Bachelor Friendly"
     : label==="families"
       ? "Families-oriented"
       : "Conditional/Depends";

   return{
    label,
    emoji,
    confidence_pct,
    response_count:n,
    breakdown,
    display: `${emoji} ${title}- ${confidence_pct}% confidence based on ${n} tenant response$(n===1 ? "" : "s")`,
   };
}