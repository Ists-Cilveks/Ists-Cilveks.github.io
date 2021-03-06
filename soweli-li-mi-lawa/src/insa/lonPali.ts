import Im from 'immutable';
import { Lon } from './lon';
import { Ijo } from './ijo';
import { NimiIjo } from './nimiAli';
import { LiSeme, NasinMusi } from './nasinMusi';
import { MaIjo } from './maIjo';

export type LonPali = Im.Map<Lon, Im.Collection<number, Im.Set<LiSeme>>>;

export function paliELonPali(maIjo: MaIjo, nasinMusi: readonly NasinMusi[]): LonPali
{
  // O PALI: nasin musi pi lukin ‘kon li ...’!
  
  return Im.Map(
    maIjo.lonIjo.mapEntries(([lon, ijoMute]) =>
      [lon, ijoMute.map((ijo, nanpa) => panaEPali(lon, ijo, nanpa, maIjo, nasinMusi))])
  );
}

function panaEPali(lon: Lon, ijo: Ijo, nanpa: number, maIjo: MaIjo, nasinMusi: readonly NasinMusi[])
{
  const ijoAntePiLonSama = maIjo.lonIjo
    .get(lon)!
    .filterNot((_, nanpaNi) => nanpaNi === nanpa)
    .toSet();
  const nimiPiIjoSitelenAntePiLonSama = ijoAntePiLonSama
    .toSeq()
    .filter(ni => ni.liSitelen())
    .map(ni => ni.nimi as NimiIjo)
    .toSet();
  
  function nasinLiLon(nasin: NasinMusi)
  {
    const semeLiLon =
      nasin.seme.contains('ali') ||
      (ijo.liNimi() && nasin.seme.contains('nimi')) ||
      (ijo.liSitelen() && nasin.seme.contains(ijo.nimi));
    
    const lonSemeLiLon =
      nasin.lonSeme.contains('ali') ||
      (nasin.lonSeme.contains('nimi') && ijoAntePiLonSama.some(ni => ni.liNimi())) ||
      (nasin.lonSeme.contains('kon') && ijoAntePiLonSama.isEmpty()) ||
      !nasin.lonSeme.intersect(nimiPiIjoSitelenAntePiLonSama).isEmpty();
    
    return semeLiLon && lonSemeLiLon;
  }
  
  const paliMute = Im.Seq(nasinMusi)
    .filter(nasinLiLon)
    .flatMap(nasin => nasin.liSeme)
    .toSet();
  return paliMute;
}
