import { IoJournal } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/JewelCancy_logo.png';

export default function Header() {
  const { t } = useTranslation();
  const isAuthenticated = useSelector(
    (state) => state?.auth?.isAuthenticated || false
  );

  const newsItems = t('header.news', { returnObjects: true });

  if (isAuthenticated) return null;

  return (
    <>
      <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-md">
        <nav className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6 py-2.5">
          <div className="flex items-center gap-3">
            
            {/* Logo */}
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <div className="bg-white  rounded-lg shadow-lg">
                <img   src={logo}
 alt="JewelCancy logo" className="w-10 h-10 rounded-full object-cover" />
              </div>

              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-extrabold tracking-wide">
                {t('app.name')}
              </span>
            </div>

            {/* News Ticker */}
            <div className="hidden md:block flex-1 overflow-hidden py-1.5 border-y border-white/20">
              <div className="marquee flex whitespace-nowrap text-sm font-medium">
                {[...newsItems, ...newsItems].map((item, index) => (
                  <div
                    key={index}
                    className="mx-6 flex items-center gap-2 text-blue-50 shrink-0"
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </nav>
      </header>

      <style>{`
        .marquee {
          animation: marquee 30s linear infinite;
        }

        .marquee:hover {
          animation-play-state: paused;
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </>
  );
}
