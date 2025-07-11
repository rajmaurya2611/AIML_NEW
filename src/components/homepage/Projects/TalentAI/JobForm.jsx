import { useState } from "react";
import { Slider, ConfigProvider, Tag, Input, Select } from "antd";
import "antd/dist/reset.css";

// export default function JobForm({ formData, setFormData }) {
export default function JobForm({ formData, setFormData, onGenerate, disabled }) {
  const [experienceRange, setExperienceRange] = useState([3, 8]);
  const [skillInput, setSkillInput] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSliderChange = (value) => {
    setExperienceRange(value);
    setFormData({ ...formData, experience: `${value[0]}-${value[1]}` });
  };

  const handleSkillAdd = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        preferredSkills: [...formData.preferredSkills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleSkillKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === "Tab") && skillInput.trim()) {
      e.preventDefault();
      handleSkillAdd();
    }

    if (e.key === "Backspace" && skillInput === "" && formData.preferredSkills.length > 0) {
      const updatedSkills = [...formData.preferredSkills];
      updatedSkills.pop();
      setFormData({
        ...formData,
        preferredSkills: updatedSkills,
      });
    }
  };

  const handleSkillRemove = (removedSkill) => {
    setFormData({
      ...formData,
      preferredSkills: formData.preferredSkills.filter((skill) => skill !== removedSkill),
    });
  };

  return (
    <div className="w-1/2 max-h-[calc(100vh-100px)] overflow-y-auto p-4 flex flex-col gap-5 jd-form-wrapper">
      <h2 className="text-xl font-semibold">Enter details to generate Job Description</h2>

      <div className="space-y-1">
        <label className="block">Job Title</label>
        <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="input rounded-lg" />
      </div>

      <div className="space-y-1">
        <label className="block">Location</label>
        <Select
          value={formData.location}
          onChange={(value) => setFormData({ ...formData, location: value })}
          className="w-full"
        >
          {['Noida', 'Hyderabad', 'Chennai', 'Banglore'].map((loc) => (
            <Option key={loc} value={loc}>{loc}</Option>
          ))}
        </Select>
      </div>

      {/* <div className="space-y-1">
        <label className="block">Employment Type</label>
        <input name="employmentType" value={formData.employmentType} onChange={handleChange} className="input rounded-lg" />
      </div> */}

      <div className="space-y-1">
        <label className="block">Employment Type</label>
        <Select
          value={formData.employmentType}
          onChange={(value) => setFormData({ ...formData, employmentType: value })}
          className="w-full"
        >
          {["Full-Time", "Contractual", "Third Party - Contractual"].map((type) => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <label className="block">Department</label>
        {/* <input name="businessUnit" value={formData.businessUnit} onChange={handleChange} className="input rounded-lg" /> */}
        <Select
          value={formData.businessUnit}
          onChange={(value) => setFormData({ ...formData, businessUnit: value })}
          className="w-full"
        >
          {["AIML", "HR", "Application", "GBS", "IEC", "SAP", "Analytics", "Empro", "Infra", "ERP", "ADMIN", "Finance", "Oracle"].map((type) => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">Experience Range</label>
        <ConfigProvider
          theme={{
            components: {
              Slider: {
                colorPrimary: "#DA2129", // slider track (filled portion)
                colorPrimaryHover: "#b71c23", // hover state
                handleColor: "#DA2129",       // thumb/circle color
                handleColorHover: "#b71c23",  // thumb hover
                trackBg: "#DA2129",           // extra: filled track
                trackHoverBg: "#b71c23",      // extra: hover fill
                railBg: "#f1f1f1", 
                handleActiveColor: "#DA2129",    // Thumb active (drag) color
              }
            },
          }}
        >
          <Slider
            range
            min={0}
            max={25}
            draggableTrack
            value={experienceRange}
            onChange={handleSliderChange}
          />
        </ConfigProvider>

        <div className="flex items-center gap-4 text-sm mt-2">
          <div className="border px-4 py-1 rounded-lg">Min: {experienceRange[0]} yrs</div>
          <span>-</span>
          <div className="border px-4 py-1 rounded-lg">Max: {experienceRange[1]} yrs</div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block">Job Description</label>
        <input name="jobDescription" value={formData.jobDescription} onChange={handleChange} className="input rounded-lg" />
      </div>

      <div className="space-y-1">
        <label className="block">Highest Qualifications</label>
        <Select
          value={formData.highestQualifications}
          onChange={(value) => setFormData({ ...formData, highestQualifications: value })}
          className="w-full"
        >
          {["M.Tech", "MCA", "MBA", "M.Com", "B.Tech", "BCA", "B.Com", "BBA", "Diploma"].map((qual) => (
            <Option key={qual} value={qual}>{qual}</Option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <label className="block">Preferred Skills</label>
        <div className="border rounded-lg p-2 flex flex-wrap gap-2">
          {formData.preferredSkills.map((skill, index) => (
            <Tag
              key={index}
              closable
              onClose={() => handleSkillRemove(skill)}
              style={{ border: "1px solid #DA2129", color: "#DA2129", borderRadius: "999px" }}
            >
              {skill}
            </Tag>
          ))}
          <Input
            size="small"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            variant="borderless"
            className="flex-grow min-w-[120px] focus:outline-none"
            placeholder="Add skill and press Enter"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block">Key Responsibilities</label>
        <input name="keyResponsibilities" value={formData.keyResponsibilities} onChange={handleChange} className="input rounded-lg" />
      </div>
      <div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled}
          className="bg-primary mt-5 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 transition"
          style={{
       backgroundColor: "#DA2129", // ← your primary
       color: "#fff",
     }}
        >
          {disabled ? "Generating…" : "Generate Job Description"}
        </button>
      </div>
    </div>
  );
}
