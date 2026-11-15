import { googleMapEmbedUrl } from '../services/googleMaps'

export default function GoogleMap({ selected, language, title }) {
  return (
    <div className="google-map" role="region" aria-label={title}>
      <iframe
        key={`${selected?.id ?? 'city'}-${language}`}
        title={title}
        src={googleMapEmbedUrl(selected, language)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  )
}
