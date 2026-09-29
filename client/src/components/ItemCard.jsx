import { Link } from 'react-router-dom';
import {
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall, Package
} from '@phosphor-icons/react';

const categoryIcons = {
  'Electronics': DeviceMobile,
  'Documents': FileText,
  'Keys': Key,
  'Bags & Wallets': Handbag,
  'Pets': PawPrint,
  'Jewellery': Diamond,
  'Clothes': TShirt,
  'Books': BookOpen,
  'Sports': SoccerBall,
  'Other': Package
};

const badgeClass = {
  lost: 'badge-lost',
  found: 'badge-found',
  claimed: 'badge-claimed',
  resolved: 'badge-resolved'
};

export default function ItemCard({ item }) {
  const Icon = categoryIcons[item.category] || Package;
  const date = new Date(item.dateLostOrFound).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short'
  });

  return (
    <Link to={`/items/${item._id}`} className="item-card">
      {/* Image */}
      <div className="item-card-image">
        {item.images?.length > 0 ? (
          <img src={item.images[0]} alt={item.title} />
        ) : (
          <div className="item-card-icon">
            <Icon size={48} weight="thin" />
          </div>
        )}
        <span className={`badge ${badgeClass[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* Body */}
      <div className="item-card-body">
        <div className="item-card-title">{item.title}</div>
        <div className="item-card-desc">{item.description}</div>
        <div className="item-card-foot">
          <div className="item-card-user">
            {item.postedBy && (
              <>
                <div className="avatar avatar-xs">
                  {item.postedBy.name?.charAt(0).toUpperCase()}
                </div>
                <span>{item.postedBy.name?.split(' ')[0]}</span>
              </>
            )}
          </div>
          <span>{item.location?.address?.split(',')[0]} · {date}</span>
        </div>
      </div>
    </Link>
  );
}