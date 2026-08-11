import { useUser } from '../context/UserContext';

export function UserSwitcher() {
  const { users, currentUser, setCurrentUserId } = useUser();

  const grouped = users.reduce<Record<string, typeof users>>((acc, u) => {
    const key = u.organization.name;
    (acc[key] ??= []).push(u);
    return acc;
  }, {});

  return (
    <div className="user-switcher">
      <label htmlFor="user-select">Logged in as</label>
      <select
        id="user-select"
        value={currentUser?.id ?? ''}
        onChange={(e) => setCurrentUserId(e.target.value)}
      >
        {Object.entries(grouped).map(([orgName, orgUsers]) => (
          <optgroup key={orgName} label={orgName}>
            {orgUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {currentUser && (
        <span className="user-switcher__org">
          {currentUser.organization.name}
        </span>
      )}
    </div>
  );
}
