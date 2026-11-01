import { useMemo, useRef } from 'preact/hooks';
import { useStore } from '../../shared/hooks/useStore';
import { AppArtwork } from './AppArtwork';
import type { HomeEnvironment } from '../types';
import type { InstalledApp, AppPresentation } from '../../settings/types';

interface Subject { key: string; title: string; detail: string; background: string; app?: InstalledApp; brand?: AppPresentation }

const NEUTRAL = '#1b2230';

// Console layout: a backdrop tinted by the focused item and a hero with its name.
// Header focus keeps the last item on screen, so moving to Settings doesn't flash.
export const ConsoleStage = ({ env }: { env: HomeEnvironment }) => {
  const { selected, active } = useStore(env.state);
  const { apps, inputs } = useStore(env.inventory);
  const last = useRef<Subject | null>(null);
  const subject = useMemo((): Subject | null => {
    if (selected.startsWith('app:')) {
      const id = selected.slice(4);
      if (id === env.runtime.config.FIREPLACE_ID) {return { key: selected, title: env.translate('Fireplace'), detail: '', background: '#3a1206' };}
      const app = apps.find(item => item.id === id);
      if (!app) {return null;}
      const brand = env.describe(app);
      return { key: selected, title: brand.title, detail: '', background: brand.background, app, brand };
    }
    if (selected.startsWith('input:')) {
      const source = inputs.find(item => 'input:' + item.type + ':' + item.number === selected);
      if (!source) {return null;}
      const label = env.runtime.inputs.label(source), port = env.runtime.inputs.portName(source);
      return { key: selected, title: label, detail: label !== port && source.type !== 'TV' ? port : env.translate('Inputs'), background: NEUTRAL };
    }
    return null;
  }, [env, selected, apps, inputs]);
  if (subject) {last.current = subject;}
  const shown = subject || last.current;
  // Two backdrop layers cross-fade by opacity only, which stays cheap on TV GPUs.
  const layers = useRef({ front: 0, paints: [NEUTRAL, NEUTRAL] });
  const paint = shown ? shown.background : NEUTRAL;
  if (layers.current.paints[layers.current.front] !== paint) {
    const front = 1 - layers.current.front;
    layers.current = { front, paints: layers.current.front === 0 ? [layers.current.paints[0], paint] : [paint, layers.current.paints[1]] };
  }
  const { front, paints } = layers.current;
  return <div class="console-stage" aria-hidden="true">
    {paints.map((background, i) => <div key={i} class={'console-wash' + (i === front ? ' is-front' : '')} style={{ background }} />)}
    <div class="console-shade" />
    {shown ? <div class="console-hero" key={shown.key}>
      {shown.app && shown.brand ? <div class="console-art" style={{ background: shown.brand.background }}>
        <AppArtwork app={shown.app} brand={shown.brand} active={active} />
      </div> : null}
      <div class="console-title">{shown.title}</div>
      {shown.detail ? <div class="console-detail">{shown.detail}</div> : null}
      <div class="console-open">{env.translate('Open')}</div>
    </div> : null}
  </div>;
};
