export function getActiveReadyDate(timezone:string,now=new Date()):string{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const value=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value;
  const year=value("year"),month=value("month"),day=value("day");
  if(!year||!month||!day)throw new Error(`Unable to determine the active date for ${timezone}`);
  return `${year}-${month}-${day}`;
}

export function formatReadyDate(date:string,options:Intl.DateTimeFormatOptions):string{
  const [year,month,day]=date.split("-").map(Number);
  if(!year||!month||!day)throw new Error(`Invalid Ready date: ${date}`);
  return new Intl.DateTimeFormat("en-US",{...options,timeZone:"UTC"}).format(new Date(Date.UTC(year,month-1,day,12)));
}
