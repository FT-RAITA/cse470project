import { PhoneCall, Users } from "lucide-react";

export default function EmergencyContactCard({ emergencyContacts = [] }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users size={16} strokeWidth={2} />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">
          Emergency Contacts
        </h3>
      </div>

      {emergencyContacts.length === 0 ? (
        <p className="text-sm text-ink-soft">No emergency contacts added yet.</p>
      ) : (
        <ul className="space-y-2">
          {emergencyContacts.map((contact, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-paper px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{contact.name}</p>
                <p className="text-xs text-ink-soft">
                  {contact.relation || "Contact"} · {contact.phone}
                </p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-paper-card transition-colors hover:bg-primary-dark"
                aria-label={`Call ${contact.name}`}
              >
                <PhoneCall size={14} strokeWidth={2} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
