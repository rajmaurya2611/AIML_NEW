import { Col, Row } from "antd";
import HeroImage from "../../assets/images/homepage/Hero Image.png";
import { Typewriter } from 'react-simple-typewriter';

const Hero = () => {
    return (
        <Row 
            className="relative w-full bg-contain h-[88vh] flex items-center justify-center"
            style={{ backgroundImage: `url(${HeroImage})` }}  
        >
            {/* Black Overlay */} 
            <div className="absolute inset-0 bg-black/50"></div>

            {/* Centered Text */}
            <Col className="relative z-10 text-center">
                <div className="text-white font-poppins font-light text-6xl mb-4">
                    Empowering Business with
                </div>
                <div className="text-white font-poppins font-regular text-6xl">
                <span className="text-6xl font-semibold text-[#F91B1B] ml-4">AI</span> Solutions
                </div>
                
                <div>
                    <p className="text-white font-light font-poppins font-light text-2xl pl-4 mt-2" >  
                    <Typewriter
          words={[
            ' Natural Language Processing',
            ' Computer Vision',
            ' Internet of Things',
            ' Gen AI',
          ]}
          loop={true}
          cursor
          cursorStyle="|"
          typeSpeed={30}
          deleteSpeed={50}
          delaySpeed={3000}
        />
                    </p>
                </div>
            </Col>
        </Row>
    );
};

export default Hero;
