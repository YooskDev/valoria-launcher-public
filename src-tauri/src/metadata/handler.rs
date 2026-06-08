#[derive(Debug)]
pub enum WrappedModpackInstallEvent<'a> {
    Base(portablemc::base::Event<'a>),
    Vanilla(portablemc::moj::Event<'a>),
    Fabric(portablemc::fabric::Event<'a>),
    Forge(portablemc::forge::Event<'a>),
}

pub struct EventHandler {
    pub consumer: Box<dyn Fn(WrappedModpackInstallEvent)>,
}

impl portablemc::base::Handler for EventHandler {
    fn on_event(&mut self, event: portablemc::base::Event) {
        (self.consumer)(WrappedModpackInstallEvent::Base(event));
    }
}

impl portablemc::moj::Handler for EventHandler {
    fn on_event(&mut self, event: portablemc::moj::Event) {
        match event {
            portablemc::moj::Event::Base(event) => portablemc::base::Handler::on_event(self, event),
            _ => (self.consumer)(WrappedModpackInstallEvent::Vanilla(event)),
        };
    }
}

impl portablemc::fabric::Handler for EventHandler {
    fn on_event(&mut self, event: portablemc::fabric::Event) {
        match event {
            portablemc::fabric::Event::Mojang(event) => {
                portablemc::moj::Handler::on_event(self, event)
            }
            _ => (self.consumer)(WrappedModpackInstallEvent::Fabric(event)),
        }
    }
}

impl portablemc::forge::Handler for EventHandler {
    fn on_event(&mut self, event: portablemc::forge::Event) {
        match event {
            portablemc::forge::Event::Mojang(event) => {
                portablemc::moj::Handler::on_event(self, event)
            }
            _ => (self.consumer)(WrappedModpackInstallEvent::Forge(event)),
        }
    }
}
