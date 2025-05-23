import Patent from './Patent';
import Process from './Process';

interface ChatProps {
  activeSub: string;
}

const Chat: React.FC<ChatProps> = ({ activeSub }) => {
  return (
    <div className="">
      {activeSub === 'patent' && <Patent />}
      {activeSub === 'process' && <Process />}
      {activeSub !== 'patent' && activeSub !== 'process' && (
        <div>
          <h2>Please select a valid chat type.</h2>
        </div>
      )}
    </div>
  );
};

export default Chat;
