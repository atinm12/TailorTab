interface Props {
  onOpenSettings: () => void;
  onChangeBackground: () => void;
  onChangeProfile: () => void;
  onResetProfile: () => void;
}

export function ProfileBar({
  onOpenSettings,
  onChangeBackground,
  onChangeProfile,
  onResetProfile,
}: Props) {
  return (
    <footer className="profile-bar">
      <button className="profile-bar-btn" onClick={onOpenSettings}>
        Settings
      </button>
      <button className="profile-bar-btn" onClick={onChangeBackground}>
        Change background
      </button>
      <button className="profile-bar-btn" onClick={onChangeProfile}>
        Change profile
      </button>
      <button className="profile-bar-btn" onClick={onResetProfile}>
        Reset profile
      </button>
    </footer>
  );
}
